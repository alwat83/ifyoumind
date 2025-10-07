import { Injectable } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts: Toast[] = [];
  
  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 3000) {
    const toast: Toast = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      duration
    };
    
    this.toasts.push(toast);
    
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast.id);
      }, duration);
    }
    
    return toast.id;
  }
  
  remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }
  
  getToasts(): Toast[] {
    return this.toasts;
  }
  
  // Convenience methods
  success(message: string, duration?: number) {
    return this.show(message, 'success', duration);
  }
  
  error(message: string, duration?: number) {
    return this.show(message, 'error', duration);
  }
  
  info(message: string, duration?: number) {
    return this.show(message, 'info', duration);
  }
  
  warning(message: string, duration?: number) {
    return this.show(message, 'warning', duration);
  }
}

