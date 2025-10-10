import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IdeaService } from '../../services/idea.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-tag-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tag-list.component.html',
  styleUrl: './tag-list.component.scss'
})
export class TagListComponent implements OnInit {
  private ideaService: IdeaService = inject(IdeaService);
  categories$: Observable<string[]> = of([]);

  ngOnInit(): void {
    this.ideaService.getCategories().then(categories => {
      this.categories$ = of(categories);
    });
  }
}
