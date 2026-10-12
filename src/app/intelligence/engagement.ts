// Decides when a result counts as engaged (event result_engaged): the result has been open for at
// least 30 seconds and the person did one meaningful thing with it (copied the market analysis,
// opened a source, or opened the print dialog). It fires at most once per page view.
// This is an engagement signal, not activation: it cannot show that anyone understood a finding.
// Kept free of Angular so test/activation-events.test.mjs can run it directly.

export type EngagementTrigger='copy'|'source'|'print';

export const ENGAGEMENT_DWELL_MS=30_000;

export class EngagementTracker {
  private fired=false;
  private pending:EngagementTrigger|null=null;

  constructor(private readonly startedAt:number,private readonly dwellMs=ENGAGEMENT_DWELL_MS){}

  /** Records an interaction. Returns the trigger when the event should be sent now. */
  interact(trigger:EngagementTrigger,now:number):EngagementTrigger|null{
    if(this.fired)return null;
    if(now-this.startedAt>=this.dwellMs){this.fired=true;return trigger;}
    this.pending??=trigger;
    return null;
  }

  /** Call once the dwell time has passed: sends an interaction that happened earlier. */
  tick(now:number):EngagementTrigger|null{
    if(this.fired||!this.pending||now-this.startedAt<this.dwellMs)return null;
    this.fired=true;
    const trigger=this.pending;
    this.pending=null;
    return trigger;
  }

  msUntilDwell(now:number):number{
    return Math.max(0,this.startedAt+this.dwellMs-now);
  }
}
