import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdeaCardComponent } from './idea-card.component';

describe('IdeaCardComponent', () => {
  let component: IdeaCardComponent;
  let fixture: ComponentFixture<IdeaCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdeaCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdeaCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
