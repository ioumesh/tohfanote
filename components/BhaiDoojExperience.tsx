'use client';

import { useEffect, useRef, useState } from 'react';
import { bhaiNoteStarters, defaultBhaiDooj } from '@/lib/bhai-dooj';
import type { Gift } from '@/lib/gift';
import { useMusic } from '@/lib/use-gift-music';
import { Envelope } from './Art';
import { BrandName } from './BrandName';
import { GiftActions } from './GiftActions';

const ritualActions = ['Light the diya', 'Place the tilak', 'Offer the sweets'];
const chapters = ['Welcome', 'Thali', 'First note', 'Second note', 'Third note', 'Memories'];

function Thali({ progress }: { progress: number }) {
  return <div className="bhai-thali" aria-hidden="true">
    <div className={`bhai-diya ${progress > 0 ? 'bhai-diya--lit' : ''}`}>
      <span className="bhai-flame" /><span className="bhai-lamp" />
    </div>
    <span className={`bhai-kumkum ${progress > 1 ? 'bhai-thali-filled' : ''}`} />
    <span className={`bhai-sweets ${progress > 2 ? 'bhai-thali-filled' : ''}`}>● ● ●</span>
  </div>;
}

export function BhaiDoojExperience({ gift, preview, onExit, onPublish, publishing, publishLabel, publishError }: {
  gift: Gift;
  preview?: boolean;
  onExit?: () => void;
  onPublish?: () => void;
  publishing?: boolean;
  publishLabel?: string;
  publishError?: string;
}) {
  const [chapter, setChapter] = useState(0);
  const [ritual, setRitual] = useState(0);
  const [photo, setPhoto] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const navigated = useRef(false);
  const music = useMusic(gift.music);
  const details = gift.bhaiDooj ?? defaultBhaiDooj;
  const notes = bhaiNoteStarters(details).map(([label, starter], i) => ({
    label, text: gift.revealNotes?.[i]?.trim() || starter,
  }));
  const note = notes[chapter - 2];

  useEffect(() => {
    if (navigated.current) heading.current?.focus({ preventScroll: true });
  }, [chapter]);

  function goTo(next: number) {
    navigated.current = true;
    setChapter(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function replay() {
    music.stop();
    setRitual(0);
    setPhoto(0);
    goTo(0);
  }

  return <main id="main" className={`experience theme-${gift.theme} bhai-experience`}>
    {preview && <div className="bhai-preview-bar">
      <button type="button" className="text-button" disabled={publishing} onClick={onExit}>← Back to editing</button>
      {onPublish && <button type="button" className="button primary" disabled={publishing} onClick={onPublish}>
        {publishing ? 'Saving…' : publishLabel ?? 'Publish free'}
      </button>}
    </div>}
    {publishError && <p role="alert" className="error bhai-publish-error">{publishError}</p>}
    <div className="bhai-story">
      <header className="bhai-story-header">
        <BrandName />
        {gift.music !== 'none' && <button type="button" className="text-button" aria-pressed={music.playing}
          onClick={music.toggle}>{music.playing ? 'Pause music' : 'Play music'}</button>}
      </header>
      <ol className="bhai-story-progress" aria-label="Bhai Dooj chapters">
        {chapters.map((name, index) => <li key={name} aria-current={chapter === index ? 'step' : undefined}>
          <span className="sr-only">{name}</span>
        </li>)}
      </ol>
      <p className="bhai-chapter-label">{chapters[chapter]} · {chapter + 1} of {chapters.length}</p>

      {chapter === 0 && <section className="bhai-story-scene bhai-welcome">
        <h1 ref={heading} tabIndex={-1}>Happy Bhai Dooj, <em>{gift.recipient}.</em></h1>
        <p>{details.bond === 'far-away' ? 'A little piece of home' : details.bond === 'playful' ? 'Sweets first, sibling stories next' : 'A celebration for my ' + details.sibling}, with love from {gift.sender}.</p>
        <Envelope name={gift.recipient} />
        <button type="button" className="button primary" onClick={() => goTo(1)}>Open your surprise</button>
      </section>}

      {chapter === 1 && <section className="bhai-story-scene">
        <h1 ref={heading} tabIndex={-1}>A thali for you</h1>
        <Thali progress={ritual} />
        <p role="status">{ritual === 3 ? 'Your Bhai Dooj thali is ready.' : `${ritual} of 3 items ready`}</p>
        {ritual < 3
          ? <button type="button" className="button primary" onClick={() => setRitual(ritual + 1)}>{ritualActions[ritual]}</button>
          : <button type="button" className="button primary" onClick={() => goTo(2)}>Open the first note</button>}
      </section>}

      {note && <section className="bhai-story-scene">
        <article className="bhai-paper-note">
          <span aria-hidden="true">✿</span>
          <h1 ref={heading} tabIndex={-1}>{note.label}</h1>
          <p>{note.text}</p>
        </article>
        <button type="button" className="button primary" onClick={() => goTo(chapter + 1)}>
          {chapter === 4 ? 'See the memories' : 'Open the next note'}
        </button>
      </section>}

      {chapter === 5 && <section className="bhai-story-scene">
        <h1 ref={heading} tabIndex={-1}>{gift.photos.length ? 'Photos of us' : 'With love, ' + gift.sender}</h1>
        {gift.photos.length > 0 && <>
          <figure className="bhai-instant-print" key={photo}>
            <img src={gift.photos[photo]} alt={`Shared memory ${photo + 1}`} />
            <figcaption>{photo + 1} of {gift.photos.length}</figcaption>
          </figure>
          {gift.photos.length > 1 && <div className="bhai-photo-controls">
            <button type="button" className="button secondary" disabled={photo === 0} onClick={() => setPhoto(photo - 1)}>Previous photo</button>
            <button type="button" className="button secondary" disabled={photo === gift.photos.length - 1} onClick={() => setPhoto(photo + 1)}>Next photo</button>
          </div>}
        </>}
        {gift.message.trim() && <article className="bhai-paper-note"><h2>A letter from {gift.sender}</h2><p>{gift.message}</p></article>}
        <button type="button" className="button secondary" onClick={replay}>Replay gift</button>
      </section>}

      {chapter > 0 && <button type="button" className="text-button bhai-story-back" onClick={() => goTo(chapter - 1)}>← Previous chapter</button>}
    </div>
    {!preview && chapter === 5 && <GiftActions />}
  </main>;
}
