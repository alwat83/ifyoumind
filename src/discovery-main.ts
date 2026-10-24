import { bootstrapApplication } from '@angular/platform-browser';
import { TaxDiscoveryComponent } from './app/discovery/tax-discovery.component';

// Deliberately separate from app.config: no Firebase, auth, analytics or persistence.
bootstrapApplication(TaxDiscoveryComponent).catch(() => {
  document.body.textContent='The local preview could not start. Reload the page to try again.';
});
