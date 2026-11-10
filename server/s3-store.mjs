import {S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command} from '@aws-sdk/client-s3';
import {recordKey,recordId} from './records.mjs';
import {MAX_GIFT_BYTES} from '../lib/limits.mjs';
const MAX_STORED_BYTES = 8 * 1024 * 1024 + 16384;

export const r2Variables = ['R2_ENDPOINT','R2_BUCKET_NAME','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY'];
function configurationError(message){return Object.assign(new Error(message),{status:503});}
export function readR2Config(env=process.env){
  const missing=r2Variables.filter(name=>!env[name]?.trim());
  if(missing.length)throw configurationError(`Gift storage is not configured. Set ${missing.join(', ')} in Vercel, then redeploy.`);
  let url;
  try{url=new URL(env.R2_ENDPOINT.trim());}catch{throw configurationError('R2_ENDPOINT must be the HTTPS S3 API endpoint shown by Cloudflare.');}
  if(url.protocol!=='https:'||! /^[a-f0-9]{32}(?:\.(?:eu|us|fedramp))?\.r2\.cloudflarestorage\.com$/i.test(url.hostname)||url.port||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw configurationError('R2_ENDPOINT must be the account-level Cloudflare S3 endpoint, without a bucket path.');
  const bucket=env.R2_BUCKET_NAME.trim();
  if(!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket))throw configurationError('R2_BUCKET_NAME must be your R2 bucket name, not a URL.');
  return {endpoint:url.origin,bucket,accessKeyId:env.R2_ACCESS_KEY_ID.trim(),secretAccessKey:env.R2_SECRET_ACCESS_KEY.trim()};
}
export function createR2Client(config){
  return new S3Client({region:'auto',endpoint:config.endpoint,forcePathStyle:true,
    credentials:{accessKeyId:config.accessKeyId,secretAccessKey:config.secretAccessKey},
    requestChecksumCalculation:'WHEN_REQUIRED',responseChecksumValidation:'WHEN_REQUIRED',
    maxAttempts:2,requestHandler:{connectionTimeout:5000,requestTimeout:10000}});
}
function status(error){return error?.$metadata?.httpStatusCode;}
function unavailable(error){
  // No credentials, endpoint, object contents or SDK error bodies reach clients/logs.
  console.error('R2 request failed',{code:error?.name||'UnknownError',status:status(error)||null});
  return configurationError('Gift storage is temporarily unavailable. Check the R2 credentials, bucket permissions and endpoint in Vercel.');
}
export function s3Store(client,bucket){
  const key=recordKey;
  return {kind:'r2',
    async list(prefix='',cursor,limit=100){try{const page=await client.send(new ListObjectsV2Command({Bucket:bucket,Prefix:prefix,ContinuationToken:cursor||undefined,MaxKeys:limit}));return {items:(page.Contents||[]).filter(o=>o.Key.endsWith('.json')).map(o=>recordId(o.Key)),cursor:page.IsTruncated?page.NextContinuationToken:null};}catch(error){throw unavailable(error);}},
    async get(id){
      try{
        const object=await client.send(new GetObjectCommand({Bucket:bucket,Key:key(id)}));
        if(object.ContentLength>MAX_STORED_BYTES)throw configurationError('This stored gift exceeds the supported size. Contact the site owner.');
        // Bound unknown Content-Length bodies too; never emit an oversized response.
        let length=0;const chunks=[];
        for await(const chunk of object.Body){length+=chunk.length;if(length>MAX_STORED_BYTES){object.Body.destroy?.();throw configurationError('This stored gift exceeds the supported size. Contact the site owner.');}chunks.push(chunk);}
        return {value:JSON.parse(Buffer.concat(chunks).toString('utf8')),etag:object.ETag};
      }catch(error){if(error.status===503)throw error;if(error.name==='NoSuchKey'||error.name==='NotFound'||status(error)===404)return null;throw unavailable(error);}
    },
    async put(id,value,etag){
      const body=JSON.stringify(value);
      if(Buffer.byteLength(body)>MAX_GIFT_BYTES)throw Object.assign(new Error('Your gift is too large. Please use smaller photos.'),{status:413});
      try{await client.send(new PutObjectCommand({Bucket:bucket,Key:key(id),Body:body,ContentType:'application/json',CacheControl:'no-store',...(etag?{IfMatch:etag}:{IfNoneMatch:'*'})}));return true;}
      catch(error){if(error.name==='PreconditionFailed'||status(error)===412||status(error)===409)return false;throw unavailable(error);}
    },
    async delete(id){try{await client.send(new DeleteObjectCommand({Bucket:bucket,Key:key(id)}));}catch(error){throw unavailable(error);}}
  };
}
