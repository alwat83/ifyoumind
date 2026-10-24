import {bootstrapApplication} from '@angular/platform-browser';
import {UnifiedDiscoveryComponent} from './app/discovery/unified-discovery.component';
import {PUBLIC_DISCOVERY} from './app/discovery/discovery-mode';
// Same Angular discovery, isolated from Firebase/auth/analytics providers. No private file leaves this page.
bootstrapApplication(UnifiedDiscoveryComponent,{providers:[{provide:PUBLIC_DISCOVERY,useValue:true}]}).catch(error=>{
 console.error('Discovery bootstrap failed',error instanceof Error?error.name:'UnknownError');
 document.body.innerHTML='<main><h1>Discovery could not open.</h1><p>Your data has not been uploaded. Reload the page to try again.</p><button type="button" id="retry-discovery">Try again</button><p><a href="/">Back to home</a></p></main>';
 document.getElementById('retry-discovery')?.addEventListener('click',()=>location.reload());
});
