import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract interactions
const mockTxSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const mockGeneratorAddress = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';

// Mock contract state
let mockVerifiedGenerators = new Map();
let mockAdmin = mockTxSender;

// Mock contract functions
const registerGenerator = (sender: string, name: string, location: string, capacity: number, technologyType: string) => {
  if (mockVerifiedGenerators.has(sender) && mockVerifiedGenerators.get(sender).verified) {
    return { error: 101 }; // ERR-ALREADY-VERIFIED
  }
  
  mockVerifiedGenerators.set(sender, {
    name,
    location,
    capacity,
    'technology-type': technologyType,
    verified: false
  });
  
  return { success: true };
};

const verifyGenerator = (sender: string, generator: string) => {
  if (sender !== mockAdmin) {
    return { error: 100 }; // ERR-NOT-AUTHORIZED
  }
  
  if (!mockVerifiedGenerators.has(generator)) {
    return { error: 102 }; // Generator not found
  }
  
  const generatorData = mockVerifiedGenerators.get(generator);
  mockVerifiedGenerators.set(generator, { ...generatorData, verified: true });
  
  return { success: true };
};

const isVerified = (generator: string) => {
  if (!mockVerifiedGenerators.has(generator)) {
    return false;
  }
  return mockVerifiedGenerators.get(generator).verified;
};

const getGeneratorDetails = (generator: string) => {
  return mockVerifiedGenerators.get(generator) || null;
};

const transferAdmin = (sender: string, newAdmin: string) => {
  if (sender !== mockAdmin) {
    return { error: 100 }; // ERR-NOT-AUTHORIZED
  }
  
  mockAdmin = newAdmin;
  return { success: true };
};

describe('Generator Verification Contract', () => {
  beforeEach(() => {
    // Reset the mock state before each test
    mockVerifiedGenerators = new Map();
    mockAdmin = mockTxSender;
  });
  
  it('should register a new generator', () => {
    const result = registerGenerator(
        mockGeneratorAddress,
        'Solar Farm Alpha',
        'California, USA',
        5000,
        'solar'
    );
    
    expect(result.success).toBe(true);
    expect(mockVerifiedGenerators.has(mockGeneratorAddress)).toBe(true);
    expect(mockVerifiedGenerators.get(mockGeneratorAddress).verified).toBe(false);
  });
  
  it('should not register an already verified generator', () => {
    // First registration
    registerGenerator(
        mockGeneratorAddress,
        'Solar Farm Alpha',
        'California, USA',
        5000,
        'solar'
    );
    
    // Verify the generator
    verifyGenerator(mockAdmin, mockGeneratorAddress);
    
    // Try to register again
    const result = registerGenerator(
        mockGeneratorAddress,
        'Solar Farm Beta',
        'Nevada, USA',
        3000,
        'solar'
    );
    
    expect(result.error).toBe(101); // ERR-ALREADY-VERIFIED
  });
  
  it('should verify a generator when called by admin', () => {
    // Register a generator
    registerGenerator(
        mockGeneratorAddress,
        'Wind Farm Delta',
        'Texas, USA',
        8000,
        'wind'
    );
    
    // Verify the generator
    const result = verifyGenerator(mockAdmin, mockGeneratorAddress);
    
    expect(result.success).toBe(true);
    expect(isVerified(mockGeneratorAddress)).toBe(true);
  });
  
  it('should not verify a generator when called by non-admin', () => {
    // Register a generator
    registerGenerator(
        mockGeneratorAddress,
        'Wind Farm Delta',
        'Texas, USA',
        8000,
        'wind'
    );
    
    // Try to verify from non-admin address
    const nonAdmin = 'ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0';
    const result = verifyGenerator(nonAdmin, mockGeneratorAddress);
    
    expect(result.error).toBe(100); // ERR-NOT-AUTHORIZED
    expect(isVerified(mockGeneratorAddress)).toBe(false);
  });
  
  it('should return generator details', () => {
    // Register a generator
    registerGenerator(
        mockGeneratorAddress,
        'Hydro Plant Gamma',
        'Washington, USA',
        12000,
        'hydro'
    );
    
    const details = getGeneratorDetails(mockGeneratorAddress);
    
    expect(details).toEqual({
      name: 'Hydro Plant Gamma',
      location: 'Washington, USA',
      capacity: 12000,
      'technology-type': 'hydro',
      verified: false
    });
  });
  
  it('should transfer admin rights', () => {
    const newAdmin = 'ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0';
    
    // Transfer admin rights
    const result = transferAdmin(mockAdmin, newAdmin);
    
    expect(result.success).toBe(true);
    expect(mockAdmin).toBe(newAdmin);
    
    // Verify that old admin can no longer perform admin actions
    const verifyResult = verifyGenerator(mockTxSender, mockGeneratorAddress);
    expect(verifyResult.error).toBe(100); // ERR-NOT-AUTHORIZED
  });
});
