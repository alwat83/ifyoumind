import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { UserService } from '../services/user.service';
import { ToastService } from '../services/toast.service';
import { Auth, user, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let auth: jasmine.SpyObj<Auth>;
  let router: jasmine.SpyObj<Router>;

  const mockUser = { uid: 'test-uid' } as User;
  const mockUserProfile = {
    displayName: 'Test User',
    username: 'testuser',
    bio: 'This is a test bio.',
    totalIdeas: 5,
    totalUpvotes: 10,
    profilePicture: 'http://example.com/pic.jpg',
    profilePicturePath: 'path/to/pic.jpg',
  };

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', [
      'getUserProfile',
      'saveUserProfile',
      'uploadProfilePicture',
      'updateProfilePicture',
      'removeProfilePicture',
    ]);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', [
      'success',
      'error',
      'info',
    ]);
    const authSpy = jasmine.createSpyObj('Auth', ['']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Auth, useValue: { user: () => of(mockUser) } },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    auth = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    userService.getUserProfile.and.returnValue(of(mockUserProfile));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('View Profile', () => {
    it('should display user profile information', () => {
      expect(component.displayName).toBe(mockUserProfile.displayName);
      expect(component.username).toBe(mockUserProfile.username);
      expect(component.bio).toBe(mockUserProfile.bio);
      expect(component.totalIdeas).toBe(mockUserProfile.totalIdeas);
      expect(component.totalUpvotes).toBe(mockUserProfile.totalUpvotes);
      expect(component.profilePicUrl).toBe(mockUserProfile.profilePicture);
      expect(component.hasProfilePic).toBe(true);
    });

    it('should display user initial if no profile picture exists', () => {
      const userProfileWithoutPic = { ...mockUserProfile, profilePicture: '' };
      userService.getUserProfile.and.returnValue(of(userProfileWithoutPic));
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.profilePicUrl).toBe('');
      expect(component.hasProfilePic).toBe(false);
      expect(component.getUserInitial()).toBe('T');
    });
  });

  describe('Edit Profile', () => {
    it('should enter edit mode', () => {
      component.startEditing();
      expect(component.isEditing).toBe(true);
      expect(component.editForm.username).toBe(mockUserProfile.username);
      expect(component.editForm.bio).toBe(mockUserProfile.bio);
    });

    it('should save profile changes', () => {
      const newProfileData = { username: 'newuser', bio: 'New bio' };
      userService.saveUserProfile.and.returnValue(of(undefined));
      component.startEditing();
      component.editForm.username = newProfileData.username;
      component.editForm.bio = newProfileData.bio;
      component.saveProfile();
      expect(userService.saveUserProfile).toHaveBeenCalledWith(
        mockUser.uid,
        newProfileData,
      );
      expect(component.isEditing).toBe(false);
      expect(component.username).toBe(newProfileData.username);
      expect(component.bio).toBe(newProfileData.bio);
      expect(toastService.success).toHaveBeenCalledWith(
        'Profile updated successfully!',
      );
    });

    it('should cancel editing', () => {
      component.startEditing();
      component.cancelEditing();
      expect(component.isEditing).toBe(false);
    });
  });

  describe('Upload Profile Picture', () => {
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });

    it('should select a file', () => {
      const event = { target: { files: [mockFile] } } as unknown as Event;
      component.onFileSelected(event);
      expect(component.selectedFile).toBe(mockFile);
      expect(component.uploadError).toBe('');
    });

    it('should not select a non-image file', () => {
      const nonImageFile = new File([''], 'test.txt', { type: 'text/plain' });
      const event = { target: { files: [nonImageFile] } } as unknown as Event;
      component.onFileSelected(event);
      expect(component.selectedFile).toBe(null);
      expect(component.uploadError).toBe('Please select an image file');
    });

    it('should not select a file larger than 5MB', () => {
      const largeFile = new File(
        new Array(6 * 1024 * 1024).fill(0),
        'large.jpg',
        { type: 'image/jpeg' },
      );
      const event = { target: { files: [largeFile] } } as unknown as Event;
      component.onFileSelected(event);
      expect(component.selectedFile).toBe(null);
      expect(component.uploadError).toBe('File size must be less than 5MB');
    });

    it('should upload a profile picture', (done) => {
      const uploadProgress = new Subject<{
        progress: number;
        completed: boolean;
        url?: string;
        path?: string;
      }>();
      userService.uploadProfilePicture.and.returnValue(
        uploadProgress.asObservable(),
      );
      userService.updateProfilePicture.and.returnValue(of(undefined));

      component.selectedFile = mockFile;
      component.currentUser = mockUser;
      component.uploadProfilePicture();

      expect(component.isUploading).toBe(true);

      uploadProgress.next({ progress: 50, completed: false });
      fixture.detectChanges();
      expect(component.uploadProgress).toBe(50);

      uploadProgress.next({
        progress: 100,
        completed: true,
        url: 'http://example.com/new.jpg',
        path: 'path/to/new.jpg',
      });
      fixture.detectChanges();

      setTimeout(() => {
        expect(userService.updateProfilePicture).toHaveBeenCalled();
        expect(component.isUploading).toBe(false);
        expect(component.selectedFile).toBe(null);
        expect(component.profilePicUrl).toBe('http://example.com/new.jpg');
        expect(toastService.success).toHaveBeenCalledWith(
          'Profile picture uploaded successfully!',
        );
        done();
      }, 0);
    });
  });

  describe('Remove Profile Picture', () => {
    it('should remove the profile picture', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      userService.removeProfilePicture.and.returnValue(of(undefined));
      component.currentUser = mockUser;
      component.hasProfilePic = true;
      component.profilePicUrl = 'http://example.com/pic.jpg';
      component.profilePicPath = 'path/to/pic.jpg';

      component.removeProfilePicture();

      expect(userService.removeProfilePicture).toHaveBeenCalledWith(
        mockUser.uid,
        'http://example.com/pic.jpg',
        'path/to/pic.jpg',
      );
      expect(component.profilePicUrl).toBe('');
      expect(component.hasProfilePic).toBe(false);
      expect(toastService.info).toHaveBeenCalledWith('Profile picture removed');
    });
  });
});
