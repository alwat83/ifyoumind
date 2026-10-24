import {InjectionToken} from '@angular/core';
// Explicit local entry selection, never inferred from a private file or public route.
export const ELECTRICITY_MODE=new InjectionToken<boolean>('local electricity preview',{providedIn:'root',factory:()=>false});

// Only the isolated public bootstrap enables public navigation/copy.
export const PUBLIC_DISCOVERY=new InjectionToken<boolean>('public discovery entry',{providedIn:'root',factory:()=>false});
