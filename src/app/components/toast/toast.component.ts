import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
})
export class ToastComponent {
  private toastService = inject(ToastService);

  get toasts(): Toast[] {
    return this.toastService.getToasts();
  }

  removeToast(id: string) {
    this.toastService.remove(id);
  }

  getToastClasses(type: string): string {
    const baseClasses =
      'glass shadow-lg rounded-lg p-4 cursor-pointer hover:scale-105 transition-transform max-w-sm';

    switch (type) {
      case 'success':
        return `${baseClasses} border-l-4 border-green-400`;
      case 'error':
        return `${baseClasses} border-l-4 border-red-400`;
      case 'warning':
        return `${baseClasses} border-l-4 border-yellow-400`;
      default:
        return `${baseClasses} border-l-4 border-blue-400`;
    }
  }

  getToastIcon(type: string): string {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  }
}
