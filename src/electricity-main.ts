import {bootstrapApplication} from '@angular/platform-browser';
import {TaxDiscoveryComponent} from './app/discovery/tax-discovery.component';
import {ELECTRICITY_MODE} from './app/discovery/discovery-mode';
// Same local lifecycle, finding presentation and analysis contracts; no production providers.
bootstrapApplication(TaxDiscoveryComponent,{providers:[{provide:ELECTRICITY_MODE,useValue:true}]}).catch(()=>{document.body.textContent='The local preview could not start. Reload the page to try again.';});
