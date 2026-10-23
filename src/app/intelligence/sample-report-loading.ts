/** A UI deadline only: no backend change or automatic retry. */
export const SAMPLE_REQUEST_TIMEOUT_MS=20_000;

export class SampleLoadFailure extends Error {
  constructor(readonly kind:'offline'|'timeout'|'cancelled'){
    super(`Public sample request ${kind}`);
    this.name='SampleLoadFailure';
  }
}

export function sampleFailureCopy(error:unknown,offline:boolean,repeated:boolean):{title:string;detail:string}{
  const code=error&&typeof error==='object'&&'code' in error?String(error.code):'';
  if(offline||(error instanceof SampleLoadFailure&&error.kind==='offline')){
    return {title:"You're offline.",detail:'Check your connection, then try again. You can still return to the homepage or read a guide already open in your browser.'};
  }
  if((error instanceof SampleLoadFailure&&error.kind==='timeout')||code==='functions/deadline-exceeded'){
    return {title:'The sample is taking too long.',detail:'Please try again. If it still does not load, explore a free guide and come back later.'};
  }
  return {
    title:repeated?'The sample still could not load.':'We could not load the sample.',
    detail:'Please try again, or explore a free guide and come back later. You do not need to register or buy a report to view this sample.',
  };
}

/** Late results cannot replace a timed-out/offline attempt. Observes late rejections too. */
export function loadSampleBeforeDeadline<T>(load:()=>Promise<T>,signal:AbortSignal,timeoutMs=SAMPLE_REQUEST_TIMEOUT_MS):Promise<T>{
  return new Promise<T>((resolve,reject)=>{
    if(signal.aborted){reject(new SampleLoadFailure(signal.reason==='offline'?'offline':'cancelled'));return;}
    let settled=false;
    const finish=(done:()=>void)=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      signal.removeEventListener('abort',abort);
      done();
    };
    const abort=()=>finish(()=>reject(new SampleLoadFailure(signal.reason==='offline'?'offline':'cancelled')));
    const timer=setTimeout(()=>finish(()=>reject(new SampleLoadFailure('timeout'))),timeoutMs);
    signal.addEventListener('abort',abort,{once:true});
    Promise.resolve().then(()=>{
      if(signal.aborted)throw new SampleLoadFailure(signal.reason==='offline'?'offline':'cancelled');
      return load();
    }).then(value=>finish(()=>resolve(value)),error=>finish(()=>reject(error)));
  });
}
