import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductCard from '../ProductCard';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="calendar-icon" />,
  MapPin: () => <div data-testid="mappin-icon" />,
  Tag: () => <div data-testid="tag-icon" />,
  CheckCircle: () => <div data-testid="checkcircle-icon" />,
  XCircle: () => <div data-testid="xcircle-icon" />,
  AlertCircle: () => <div data-testid="alertcircle-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Edit: () => <div data-testid="edit-icon" />
}));

const mockProduct = {
  id: 'product-1',
  name: 'MacBook Pro 16"',
  description: 'High-performance laptop for development work',
  brand: 'Apple',
  model: 'MacBook Pro',
  serialNumber: 'MBP123456',
  location: 'Office A - Desk 12',
  conditionStatus: 'excellent',
  isAvailable: true,
  maxLendingPeriod: 30,
  requiresApproval: false,
  purchaseDate: '2023-01-15',
  imageUrls: ['/images/macbook1.jpg', '/images/macbook2.jpg'],
  tags: ['laptop', 'development', 'apple'],
  specifications: {
    cpu: 'M2 Pro',
    ram: '16GB',
    storage: '512GB SSD'
  }
};

describe('ProductCard', () => {
  const defaultProps = {
    product: mockProduct,
    onView: jest.fn(),
    onEdit: jest.fn(),
    onBorrow: jest.fn(),
    showActions: true,
    isAdmin: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders product information correctly', () => {
    render(<ProductCard {...defaultProps} />);

    expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
    expect(screen.getByText('Apple • MacBook Pro')).toBeInTheDocument();
    expect(screen.getByText('High-performance laptop for development work')).toBeInTheDocument();
    expect(screen.getByText('Office A - Desk 12')).toBeInTheDocument();
    expect(screen.getByText('SN: MBP123456')).toBeInTheDocument();
    expect(screen.getByText('30 days')).toBeInTheDocument();
  });

  it('displays availability badge correctly for available product', () => {
    render(<ProductCard {...defaultProps} />);

    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByTestId('checkcircle-icon')).toBeInTheDocument();
  });

  it('displays availability badge correctly for unavailable product', () => {
    const unavailableProduct = { ...mockProduct, isAvailable: false };
    render(<ProductCard {...defaultProps} product={unavailableProduct} />);

    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('xcircle-icon')).toBeInTheDocument();
  });

  it('displays condition badge with correct styling', () => {
    render(<ProductCard {...defaultProps} />);

    expect(screen.getByText('EXCELLENT')).toBeInTheDocument();
  });

  it('shows product image when available', () => {
    render(<ProductCard {...defaultProps} />);

    const image = screen.getByAltText('MacBook Pro 16"');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/macbook1.jpg');
  });

  it('shows placeholder when no image is available', () => {
    const productWithoutImage = { ...mockProduct, imageUrls: [] };
    render(<ProductCard {...defaultProps} product={productWithoutImage} />);

    expect(screen.getAllByTestId('tag-icon')).toHaveLength(2); // One in placeholder, one for serial number
  });

  it('displays tags correctly', () => {
    render(<ProductCard {...defaultProps} />);

    expect(screen.getByText('laptop')).toBeInTheDocument();
    expect(screen.getByText('development')).toBeInTheDocument();
    expect(screen.getByText('apple')).toBeInTheDocument();
  });

  it('shows "requires approval" indicator when needed', () => {
    const productRequiringApproval = { ...mockProduct, requiresApproval: true };
    render(<ProductCard {...defaultProps} product={productRequiringApproval} />);

    expect(screen.getByText('Requires approval')).toBeInTheDocument();
    expect(screen.getByTestId('alertcircle-icon')).toBeInTheDocument();
  });

  it('displays correct action buttons for regular user', () => {
    render(<ProductCard {...defaultProps} />);

    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Borrow')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('displays correct action buttons for admin user', () => {
    render(<ProductCard {...defaultProps} isAdmin={true} />);

    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.queryByText('Borrow')).not.toBeInTheDocument();
  });

  it('hides borrow button for unavailable products', () => {
    const unavailableProduct = { ...mockProduct, isAvailable: false };
    render(<ProductCard {...defaultProps} product={unavailableProduct} />);

    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.queryByText('Borrow')).not.toBeInTheDocument();
  });

  it('hides actions when showActions is false', () => {
    render(<ProductCard {...defaultProps} showActions={false} />);

    expect(screen.queryByText('View Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Borrow')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('calls onView when View Details button is clicked', () => {
    render(<ProductCard {...defaultProps} />);

    fireEvent.click(screen.getByText('View Details'));
    expect(defaultProps.onView).toHaveBeenCalledWith(mockProduct);
  });

  it('calls onEdit when Edit button is clicked (admin)', () => {
    render(<ProductCard {...defaultProps} isAdmin={true} />);

    fireEvent.click(screen.getByText('Edit'));
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockProduct);
  });

  it('calls onBorrow when Borrow button is clicked', () => {
    render(<ProductCard {...defaultProps} />);

    fireEvent.click(screen.getByText('Borrow'));
    expect(defaultProps.onBorrow).toHaveBeenCalledWith(mockProduct);
  });

  it('formats purchase date correctly', () => {
    render(<ProductCard {...defaultProps} />);

    expect(screen.getByText(/Purchased: 1\/15\/2023/)).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalProduct = {
      id: 'product-2',
      name: 'Basic Product',
      categoryId: 1,
      conditionStatus: 'good',
      isAvailable: true,
      maxLendingPeriod: 30,
      requiresApproval: false
    };

    render(<ProductCard {...defaultProps} product={minimalProduct} />);

    expect(screen.getAllByText('Basic Product')).toHaveLength(2); // Title and placeholder
    expect(screen.getByText('30 days')).toBeInTheDocument();
  });

  it('truncates long tag lists correctly', () => {
    const productWithManyTags = {
      ...mockProduct,
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
    };

    render(<ProductCard {...defaultProps} product={productWithManyTags} />);

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('tag3')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('applies hover effects with correct CSS classes', () => {
    const { container } = render(<ProductCard {...defaultProps} />);

    const card = container.querySelector('.group');
    expect(card).toHaveClass('group', 'transition-all', 'duration-200', 'hover:shadow-xl');
  });
});