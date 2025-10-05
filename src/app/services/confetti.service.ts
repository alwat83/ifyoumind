import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfettiService {
  
  triggerConfetti(element: HTMLElement, type: 'upvote' | 'success' | 'celebration' = 'upvote') {
    const colors = this.getColors(type);
    const particleCount = this.getParticleCount(type);
    
    for (let i = 0; i < particleCount; i++) {
      this.createParticle(element, colors);
    }
  }
  
  private createParticle(element: HTMLElement, colors: string[]) {
    const particle = document.createElement('div');
    const rect = element.getBoundingClientRect();
    
    // Random position around the element
    const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * rect.width;
    const y = rect.top + rect.height / 2 + (Math.random() - 0.5) * rect.height;
    
    // Random color
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Style the particle
    particle.style.position = 'fixed';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.width = '6px';
    particle.style.height = '6px';
    particle.style.backgroundColor = color;
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '9999';
    particle.style.boxShadow = `0 0 10px ${color}`;
    
    // Animation
    const animation = particle.animate([
      { 
        transform: 'translateY(0px) scale(1)', 
        opacity: 1 
      },
      { 
        transform: `translateY(-${100 + Math.random() * 100}px) scale(0)`, 
        opacity: 0 
      }
    ], {
      duration: 1000 + Math.random() * 500,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
    
    document.body.appendChild(particle);
    
    animation.onfinish = () => {
      if (document.body.contains(particle)) {
        document.body.removeChild(particle);
      }
    };
  }
  
  private getColors(type: string): string[] {
    switch (type) {
      case 'upvote':
        return ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'];
      case 'success':
        return ['#10B981', '#34D399', '#6EE7B7'];
      case 'celebration':
        return ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'];
      default:
        return ['#3B82F6', '#8B5CF6'];
    }
  }
  
  private getParticleCount(type: string): number {
    switch (type) {
      case 'upvote':
        return 8;
      case 'success':
        return 12;
      case 'celebration':
        return 20;
      default:
        return 6;
    }
  }
}

