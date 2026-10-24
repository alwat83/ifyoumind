import {InjectionToken} from '@angular/core';
// Explicit local entry selection, never inferred from a private file or public route.
export const ELECTRICITY_MODE=new InjectionToken<boolean>('local electricity preview',{providedIn:'root',factory:()=>false});
