import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, User } from '@angular/fire/auth';
import { user } from '@angular/fire/auth';
import { UserService, UserProfile } from '../../services/user.service';
import { Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checklist.component.html',
  styleUrl: './checklist.component.scss',
})
export class ChecklistComponent implements OnInit {
  private auth: Auth = inject(Auth);
  private userService: UserService = inject(UserService);
  user$: Observable<User | null> = user(this.auth);
  profile$: Observable<UserProfile | null> = of(null);

  showChecklist = false;
  taskStatus = {
    submitIdea: false,
    comment: false,
    upvote: false,
  };
  completedTasks = 0;
  totalTasks = 3;
  progress = 0;
  badgeAwarded = false;

  ngOnInit(): void {
    this.profile$ = this.user$.pipe(
      switchMap((user) =>
        user ? this.userService.getUserProfile(user.uid) : of(null),
      ),
      tap((profile) => {
        if (profile) {
          this.updateChecklist(profile);
        }
      }),
    );
  }

  updateChecklist(profile: UserProfile): void {
    if (
      profile.hasDismissedChecklist ||
      (profile.badges && profile.badges.includes('Pioneer'))
    ) {
      this.showChecklist = false;
      return;
    }
    this.showChecklist = true;

    this.taskStatus.submitIdea = (profile.totalIdeas ?? 0) > 0;
    this.taskStatus.comment = (profile.totalComments ?? 0) > 0;
    this.taskStatus.upvote = (profile.totalUpvotes ?? 0) > 0;

    this.completedTasks = Object.values(this.taskStatus).filter(Boolean).length;
    this.progress = (this.completedTasks / this.totalTasks) * 100;

    if (
      this.completedTasks === this.totalTasks &&
      (!profile.badges || !profile.badges.includes('Pioneer'))
    ) {
      this.awardBadge(profile);
      this.badgeAwarded = true;
    }
  }

  awardBadge(profile: UserProfile): void {
    const currentBadges = profile.badges || [];
    this.userService
      .saveUserProfile(profile.id!, { badges: [...currentBadges, 'Pioneer'] })
      .subscribe();
  }

  dismiss(): void {
    this.showChecklist = false;
    const userId = this.auth.currentUser?.uid;
    if (userId) {
      this.userService
        .saveUserProfile(userId, { hasDismissedChecklist: true })
        .subscribe();
    }
  }
}
