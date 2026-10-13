// Which first-party product events are accepted, and exactly which context each may carry.
// Context values are enumerations or opaque record ids only: never names, emails, places typed by
// the user, or free text. Unknown keys and values that fail their pattern are dropped, not stored.

const RECORD_ID=/^[A-Za-z0-9_-]{1,64}$/;

/** null = an established event that keeps the general cleaning rules below. */
export const EVENT_CONTEXT:Record<string,Record<string,RegExp>|null>={
  app_open:null,
  decision_created:null,
  report_view:null,
  pricing_view:null,
  checkout_started:null,
  checkout_success:null,
  checkout_cancelled:null,
  billing_portal_opened:null,
  // Names say only what the code can observe. See docs/analytics/product-events.md.
  // Engagement signal, not activation: the result was open 30 s or more and the person copied the
  // market analysis, opened a source or opened the print dialog. It cannot show understanding.
  result_engaged:{trigger:/^(copy|source|print)$/,project:RECORD_ID},
  // "shown" = rendered on the page, not proof that anyone looked at it.
  upgrade_panel_shown:{offer:/^report$/,project:RECORD_ID},
  intent_prompt_shown:{project:RECORD_ID},
  intent_prompt_clicked:{project:RECORD_ID},
  // The browser confirmed the copy to the clipboard.
  market_analysis_copied:{project:RECORD_ID},
  // window.print() was called; we cannot know whether anything was printed or saved.
  print_dialog_opened:{project:RECORD_ID},
};

export function isAllowedEvent(event:unknown):event is string{
  return typeof event==='string'&&Object.prototype.hasOwnProperty.call(EVENT_CONTEXT,event);
}

const looksPersonal=(text:string)=>/@|\s{2,}/.test(text);

/** General rules for established events: up to 8 short string values, nothing that looks like an email. */
export function cleanContext(value:unknown):Record<string,string>{
  if(!value||typeof value!=='object'||Array.isArray(value))return {};
  const output:Record<string,string>={};
  for(const [key,raw] of Object.entries(value as Record<string,unknown>).slice(0,8)){
    if(!/^[A-Za-z0-9_-]{1,40}$/.test(key))continue;
    if(typeof raw!=='string')continue;
    const text=raw.trim().slice(0,120);
    if(text&&!looksPersonal(text))output[key]=text;
  }
  return output;
}

/** The context stored for an event: schema-checked for new events, general rules for established ones. */
export function eventContext(event:string,value:unknown):Record<string,string>{
  const schema=EVENT_CONTEXT[event];
  if(schema===null||schema===undefined)return cleanContext(value);
  if(!value||typeof value!=='object'||Array.isArray(value))return {};
  const output:Record<string,string>={};
  for(const [key,pattern] of Object.entries(schema)){
    const raw=(value as Record<string,unknown>)[key];
    if(typeof raw==='string'&&pattern.test(raw))output[key]=raw;
  }
  return output;
}
