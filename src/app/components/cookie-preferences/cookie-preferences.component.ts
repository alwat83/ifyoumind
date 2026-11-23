import { AfterViewInit, Component, DestroyRef, ElementRef, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CookiePreferencesService } from '../../services/cookie-preferences.service';
import { CookieService } from '../../services/cookie.service';
@Component({ selector: 'app-cookie-preferences', standalone: true, imports: [], templateUrl: './cookie-preferences.component.html', styleUrls: ['./cookie-preferences.component.scss'] })
export class CookiePreferencesComponent implements AfterViewInit {
    private preferences = inject(CookiePreferencesService);
    private cookies = inject(CookieService);
    private destroy = inject(DestroyRef);
    @ViewChild('dialog')
    dialog!: ElementRef<HTMLDialogElement>;
    @ViewChild('choice')
    choice!: ElementRef<HTMLInputElement>;
    ngAfterViewInit(): void { this.preferences.isOpen$.pipe(takeUntilDestroyed(this.destroy)).subscribe(open => { if (open) {
        this.choice.nativeElement.checked = this.cookies.hasConsent('analytics');
        this.dialog.nativeElement.showModal();
    }
    else if (this.dialog.nativeElement.open)
        this.dialog.nativeElement.close(); }); }
    close(): void { this.preferences.close(); }
    save(): void { this.cookies.updateConsent({ essential: true, analytics: this.choice.nativeElement.checked, functional: false, marketing: false }); this.close(); }
    rejectAll(): void { this.cookies.rejectAll(); this.close(); }
}
