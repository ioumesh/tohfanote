import { bhaiBonds, bhaiNoteStarters, defaultBhaiDooj, type BhaiDoojDetails } from '@/lib/bhai-dooj';
import type { Gift } from '@/lib/gift';

export function BhaiDoojFields({ step, gift, update }: {
  step: number;
  gift: Gift;
  update: <K extends keyof Gift>(key: K, value: Gift[K]) => void;
}) {
  const details = gift.bhaiDooj ?? defaultBhaiDooj;
  const starters = bhaiNoteStarters(details);

  function chooseBond(bond: BhaiDoojDetails['bond']) {
    const next = { ...details, bond };
    const defaults = bhaiNoteStarters(next);
    update('bhaiDooj', next);
    update('revealNotes', defaults.map(([, text], i) => {
      const previous = gift.revealNotes?.[i];
      return previous === undefined || previous === starters[i][1] ? text : previous;
    }));
  }

  function writeNote(index: number, text: string) {
    update('revealNotes', starters.map(([, starter], i) =>
      i === index ? text : gift.revealNotes?.[i] ?? starter,
    ));
  }

  if (step === 0) {
    return <>
      <fieldset className="bhai-choices">
        <legend>Who is this for?</legend>
        {(['brother', 'sister'] as const).map(sibling => (
          <button type="button" key={sibling} aria-pressed={details.sibling === sibling}
            onClick={() => update('bhaiDooj', { ...details, sibling })}>
            My {sibling}
          </button>
        ))}
      </fieldset>
      <div className="field-grid">
        <label>Their name<input required maxLength={60} value={gift.recipient}
          placeholder={details.sibling === 'brother' ? 'Bhaiya or their name' : 'Didi or their name'}
          onChange={e => update('recipient', e.target.value)} /></label>
        <label>Your name<input required maxLength={60} autoComplete="given-name" value={gift.sender}
          onChange={e => update('sender', e.target.value)} /></label>
      </div>
    </>;
  }
  if (step === 1) {
    return <fieldset className="bhai-choices bhai-choices--bond">
      <legend>Choose a tone for the notes</legend>
      {bhaiBonds.map(bond => <button type="button" key={bond.id} aria-pressed={details.bond === bond.id}
        onClick={() => chooseBond(bond.id)}>
        <strong>{bond.label}</strong><small>{bond.description}</small>
      </button>)}
    </fieldset>;
  }
  if (step !== 2) return null;
  return <div className="bhai-note-fields">
    {starters.map(([label, starter], index) => {
      const value = gift.revealNotes?.[index] ?? starter;
      return <div className="bhai-note-field" key={index}>
        <label htmlFor={`bhai-note-${index}`}>{label}</label>
        <textarea id={`bhai-note-${index}`} rows={2} required maxLength={160} value={value}
          onChange={e => writeNote(index, e.target.value)} />
        <div className="bhai-note-tools">
          {value !== starter && <button type="button" className="text-button"
            onClick={() => writeNote(index, starter)}>Restore starter</button>}
          <small>{value.length}/160</small>
        </div>
      </div>;
    })}
    <details className="builder-option">
      <summary>Add a longer letter<span>Optional</span></summary>
      <div className="builder-option-content">
        <label>Your letter<textarea rows={4} maxLength={5000} value={gift.message}
          onChange={e => update('message', e.target.value)} /></label>
      </div>
    </details>
  </div>;
}
