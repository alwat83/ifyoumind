import { TestBed } from '@angular/core/testing';
import { IdeaService } from './idea.service';
import { Firestore } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Functions } from '@angular/fire/functions';
import { UserService } from './user.service';
import * as firestore from '@angular/fire/firestore';

describe('IdeaService', () => {
  let service: IdeaService;
  let firestoreMock: Partial<Firestore>;

  beforeEach(() => {
    firestoreMock = {};

    TestBed.configureTestingModule({
      providers: [
        IdeaService,
        { provide: Firestore, useValue: firestoreMock },
        { provide: Auth, useValue: {} },
        { provide: Functions, useValue: {} },
        { provide: UserService, useValue: {} },
      ],
    });
    service = TestBed.inject(IdeaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('requestToJoin', () => {
    it('should call updateDoc with the correct arguments', async () => {
      const ideaId = 'test-idea-id';
      const userId = 'test-user-id';

      // Spy on the standalone functions from @angular/fire/firestore
      const docSpy = spyOn(firestore, 'doc').and.returnValue(null as any);
      const updateDocSpy = spyOn(firestore, 'updateDoc').and.resolveTo();
      const arrayUnionSpy = spyOn(firestore, 'arrayUnion').and.returnValue(
        null as any,
      );

      await service.requestToJoin(ideaId, userId);

      // Check that doc was called correctly
      expect(docSpy).toHaveBeenCalledWith(
        TestBed.inject(Firestore),
        'ideas',
        ideaId,
      );

      // Check that updateDoc was called
      expect(updateDocSpy).toHaveBeenCalled();

      // Check that arrayUnion was called with the user ID
      expect(arrayUnionSpy).toHaveBeenCalledWith(userId);
    });
  });
});
