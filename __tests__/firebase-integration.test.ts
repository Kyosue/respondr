import { cloudinaryService } from '@/firebase/cloudinary';
import { borrowerService, resourceService, transactionService } from '@/firebase/resources';

// Mock Firebase and Cloudinary for testing
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  writeBatch: jest.fn(),
}));

// Mock Cloudinary service
jest.mock('@/firebase/cloudinary', () => ({
  cloudinaryService: {
    generateImageUrl: jest.fn(() => 'https://example.com/image.jpg'),
    generateThumbnailUrl: jest.fn(() => 'https://example.com/image.jpg'),
    generateResponsiveImageUrl: jest.fn(() => 'https://example.com/image.jpg'),
    uploadImage: jest.fn(() => Promise.resolve({
      public_id: 'test-image',
      secure_url: 'https://example.com/image.jpg',
      width: 200,
      height: 200,
      format: 'jpg',
      resource_type: 'image',
      bytes: 1000,
      created_at: new Date().toISOString()
    })),
    deleteImage: jest.fn(() => Promise.resolve())
  },
  imageUtils: {
    uploadResourceImage: jest.fn(() => Promise.resolve({
      public_id: 'test-image',
      secure_url: 'https://example.com/image.jpg',
      width: 200,
      height: 200,
      format: 'jpg',
      resource_type: 'image',
      bytes: 1000,
      created_at: new Date().toISOString()
    })),
    uploadBorrowerImage: jest.fn(() => Promise.resolve({
      public_id: 'test-image',
      secure_url: 'https://example.com/image.jpg',
      width: 200,
      height: 200,
      format: 'jpg',
      resource_type: 'image',
      bytes: 1000,
      created_at: new Date().toISOString()
    })),
    generateResourceImageUrl: jest.fn(() => 'https://example.com/image.jpg'),
    generateBorrowerImageUrl: jest.fn(() => 'https://example.com/image.jpg')
  }
}));

describe('Firebase Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Resource Service', () => {
    it('should create a resource', async () => {
      const mockResource = {
        name: 'Test Resource',
        description: 'Test Description',
        category: 'equipment' as const,
        totalQuantity: 1,
        availableQuantity: 1,
        images: [],
        location: 'Test Location',
        status: 'active' as const,
        condition: 'good' as const,
        tags: ['test'],
        createdBy: 'test-user',
        updatedBy: 'test-user'
      };

      // Mock the addDoc function
      const mockAddDoc = require('firebase/firestore').addDoc;
      mockAddDoc.mockResolvedValue({ id: 'test-resource-id' });

      const result = await resourceService.createResource(mockResource);
      
      expect(result).toBe('test-resource-id');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining(mockResource)
      );
    });

    it('should get a resource by ID', async () => {
      const mockResource = {
        id: 'test-resource-id',
        name: 'Test Resource',
        description: 'Test Description',
        category: 'equipment',
        totalQuantity: 1,
        availableQuantity: 1,
        images: [],
        location: 'Test Location',
        status: 'active',
        condition: 'good',
        tags: ['test'],
        createdBy: 'test-user',
        updatedBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockGetDoc = require('firebase/firestore').getDoc;
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'test-resource-id',
        data: () => mockResource
      });

      const result = await resourceService.getResource('test-resource-id');
      
      expect(result).toEqual(mockResource);
    });

    it('should update a resource', async () => {
      const mockUpdateDoc = require('firebase/firestore').updateDoc;
      mockUpdateDoc.mockResolvedValue(undefined);

      await resourceService.updateResource('test-resource-id', {
        name: 'Updated Resource Name'
      });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'Updated Resource Name',
          updatedAt: expect.any(Date)
        })
      );
    });

    it('should delete a resource', async () => {
      const mockDeleteDoc = require('firebase/firestore').deleteDoc;
      mockDeleteDoc.mockResolvedValue(undefined);

      await resourceService.deleteResource('test-resource-id');

      expect(mockDeleteDoc).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('Transaction Service', () => {
    it('should create a transaction', async () => {
      const mockTransaction = {
        resourceId: 'test-resource-id',
        userId: 'test-user-id',
        type: 'borrow' as const,
        quantity: 1,
        status: 'active' as const,
        notes: 'Test notes',
        borrowerName: 'Test Borrower',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockAddDoc = require('firebase/firestore').addDoc;
      mockAddDoc.mockResolvedValue({ id: 'test-transaction-id' });

      const result = await transactionService.createTransaction(mockTransaction);
      
      expect(result).toBe('test-transaction-id');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining(mockTransaction)
      );
    });
  });

  describe('Borrower Service', () => {
    it('should upsert a borrower', async () => {
      const mockBorrower = {
        name: 'Test Borrower',
        contact: 'test@example.com',
        department: 'IT',
        totalBorrowed: 0,
        activeBorrows: 0,
        overdueItems: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockGetDocs = require('firebase/firestore').getDocs;
      mockGetDocs.mockResolvedValue({
        empty: true,
        docs: []
      });

      const mockAddDoc = require('firebase/firestore').addDoc;
      mockAddDoc.mockResolvedValue({ id: 'test-borrower-id' });

      const result = await borrowerService.upsertBorrower(mockBorrower);
      
      expect(result).toBe('test-borrower-id');
    });
  });
});

describe('Cloudinary Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate image URL', () => {
    const publicId = 'test-image';
    const url = cloudinaryService.generateImageUrl(publicId, {
      width: 200,
      height: 200,
      crop: 'fill'
    });

    expect(url).toBe('https://example.com/image.jpg');
  });

  it('should generate thumbnail URL', () => {
    const publicId = 'test-image';
    const url = cloudinaryService.generateThumbnailUrl(publicId, 150);

    expect(url).toBe('https://example.com/image.jpg');
  });

  it('should generate responsive URL', () => {
    const publicId = 'test-image';
    const url = cloudinaryService.generateResponsiveImageUrl(publicId, 800);

    expect(url).toBe('https://example.com/image.jpg');
  });
});
