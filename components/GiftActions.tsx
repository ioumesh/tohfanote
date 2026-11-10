import Link from 'next/link';
import {CreatorCredit} from './CreatorCredit';
export function GiftActions(){return <div className="gift-actions"><p>A little feeling worth passing on.</p><div className="button-row"><Link className="button primary" href="/create/">Create yours ♡</Link><Link className="button secondary" href="/manage/">Manage a gift</Link></div><small>Creators need their private management link to make changes.</small><CreatorCredit/></div>;}
