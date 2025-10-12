import {
  Component,
  Input,
  inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Idea, IdeaService } from '../../services/idea.service';
import { UserService, UserProfile } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-team-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-manager.component.html',
  styleUrl: './team-manager.component.scss',
})
export class TeamManagerComponent implements OnChanges {
  @Input() idea: Idea | null = null;

  private ideaService = inject(IdeaService);
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  joinRequestUsers$: Observable<UserProfile[]> = of([]);
  collaboratorUsers$: Observable<UserProfile[]> = of([]);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idea']) {
      this.updateUsers();
    }
  }

  updateUsers() {
    if (this.idea?.joinRequests?.length) {
      this.joinRequestUsers$ = this.userService.getUsers(
        this.idea.joinRequests,
      );
    }
    if (this.idea?.collaborators?.length) {
      this.collaboratorUsers$ = this.userService.getUsers(
        this.idea.collaborators,
      );
    }
  }

  accept(userId: string) {
    if (!this.idea?.id) return;
    this.ideaService.acceptJoinRequest(this.idea.id, userId);
    this.toastService.success('User accepted');
  }

  decline(userId: string) {
    if (!this.idea?.id) return;
    this.ideaService.declineJoinRequest(this.idea.id, userId);
    this.toastService.info('User declined');
  }

  remove(userId: string) {
    if (!this.idea?.id) return;
    this.ideaService.removeCollaborator(this.idea.id, userId);
    this.toastService.info('User removed');
  }
}
