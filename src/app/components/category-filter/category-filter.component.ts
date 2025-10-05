import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-filter.component.html',
  styleUrls: ['./category-filter.component.scss']
})
export class CategoryFilterComponent {
  @Output() categorySelected = new EventEmitter<string>();
  
  categories = ['all', 'technology', 'environment', 'health', 'education', 'social', 'business', 'general'];
  selectedCategory = 'all';
  
  selectCategory(category: string) {
    this.selectedCategory = category;
    this.categorySelected.emit(category);
  }
  
  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'all': '🌟',
      'technology': '💻',
      'environment': '🌱',
      'health': '🏥',
      'education': '📚',
      'social': '🤝',
      'business': '💼',
      'general': '💡'
    };
    return icons[category] || '💡';
  }
}

