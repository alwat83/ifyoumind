import {bootstrapApplication} from '@angular/platform-browser';
import {UnifiedDiscoveryComponent} from './app/discovery/unified-discovery.component';
// Isolated local entry: no production app providers, auth, analytics or persistence.
bootstrapApplication(UnifiedDiscoveryComponent).catch(()=>{document.body.textContent='Discovery could not start. Reload the page to try again.';});
