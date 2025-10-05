import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdeaSubmitComponent } from './idea-submit.component';

describe('IdeaSubmitComponent', () => {
  let component: IdeaSubmitComponent;
  let fixture: ComponentFixture<IdeaSubmitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdeaSubmitComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdeaSubmitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
