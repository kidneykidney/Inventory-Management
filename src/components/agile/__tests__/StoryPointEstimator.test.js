import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StoryPointEstimator from '../StoryPointEstimator';

const mockOnEstimate = jest.fn();

describe('StoryPointEstimator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all fibonacci point options', () => {
    render(<StoryPointEstimator onEstimate={mockOnEstimate} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.getByText('21')).toBeInTheDocument();
  });

  it('renders point descriptions', () => {
    render(<StoryPointEstimator onEstimate={mockOnEstimate} />);

    expect(screen.getByText('Very Simple')).toBeInTheDocument();
    expect(screen.getByText('Simple')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Complex')).toBeInTheDocument();
    expect(screen.getByText('Very Complex')).toBeInTheDocument();
    expect(screen.getByText('Extremely Complex')).toBeInTheDocument();
    expect(screen.getByText('Epic (Break Down)')).toBeInTheDocument();
  });

  it('calls onEstimate when point is selected', () => {
    render(<StoryPointEstimator onEstimate={mockOnEstimate} />);

    const fivePointButton = screen.getByRole('button', { name: /5.*Complex/ });
    fireEvent.click(fivePointButton);

    expect(mockOnEstimate).toHaveBeenCalledWith(5);
  });

  it('shows selected point in badge', () => {
    render(<StoryPointEstimator onEstimate={mockOnEstimate} />);

    const threePointButton = screen.getByRole('button', { name: /3.*Medium/ });
    fireEvent.click(threePointButton);

    expect(screen.getByText('Selected: 3 story points')).toBeInTheDocument();
  });

  it('highlights selected point button', () => {
    render(
      <StoryPointEstimator onEstimate={mockOnEstimate} currentEstimate={5} />
    );

    const fivePointButton = screen.getByRole('button', { name: /5.*Complex/ });
    expect(fivePointButton).toHaveClass('bg-primary');
  });

  it('shows guidance for selected point', () => {
    render(<StoryPointEstimator onEstimate={mockOnEstimate} />);

    const eightPointButton = screen.getByRole('button', {
      name: /8.*Very Complex/,
    });
    fireEvent.click(eightPointButton);

    expect(screen.getByText('8 Points - Very Complex')).toBeInTheDocument();
    expect(
      screen.getByText('Large feature, high complexity, significant unknowns')
    ).toBeInTheDocument();
    expect(screen.getByText('1-2 weeks')).toBeInTheDocument();
  });

  it('shows warning for 21 points', () => {
    render(<StoryPointEstimator onEstimate={mockOnEstimate} />);

    const twentyOnePointButton = screen.getByRole('button', {
      name: /21.*Epic/,
    });
    fireEvent.click(twentyOnePointButton);

    expect(
      screen.getByText('Consider breaking this down into smaller stories')
    ).toBeInTheDocument();
  });

  it('shows examples for selected point', () => {
    render(<StoryPointEstimator onEstimate={mockOnEstimate} />);

    const twoPointButton = screen.getByRole('button', { name: /2.*Simple/ });
    fireEvent.click(twoPointButton);

    expect(screen.getByText('Examples:')).toBeInTheDocument();
    expect(screen.getByText('Add validation')).toBeInTheDocument();
    expect(screen.getByText('Simple UI change')).toBeInTheDocument();
    expect(screen.getByText('Basic CRUD operation')).toBeInTheDocument();
  });

  it('toggles estimation guide visibility', () => {
    render(<StoryPointEstimator onEstimate={mockOnEstimate} />);

    expect(screen.queryByText('Estimation Factors')).not.toBeInTheDocument();

    const showGuideButton = screen.getByRole('button', {
      name: 'Show Estimation Guide',
    });
    fireEvent.click(showGuideButton);

    expect(screen.getByText('Estimation Factors')).toBeInTheDocument();
    expect(screen.getByText('Hide Estimation Guide')).toBeInTheDocument();
  });

  it('shows estimation factors when guide is visible', () => {
    render(<StoryPointEstimator onEstimate={mockOnEstimate} />);

    const showGuideButton = screen.getByRole('button', {
      name: 'Show Estimation Guide',
    });
    fireEvent.click(showGuideButton);

    expect(screen.getByText('Time Complexity')).toBeInTheDocument();
    expect(screen.getByText('Technical Complexity')).toBeInTheDocument();
    expect(screen.getByText('Team Knowledge')).toBeInTheDocument();
    expect(screen.getByText('Risk & Uncertainty')).toBeInTheDocument();
  });

  it('shows factor levels with correct colors', () => {
    render(<StoryPointEstimator onEstimate={mockOnEstimate} />);

    const showGuideButton = screen.getByRole('button', {
      name: 'Show Estimation Guide',
    });
    fireEvent.click(showGuideButton);

    // Check that different levels have different colors
    const trivialBadge = screen.getByText('Trivial');
    const veryHighBadge = screen.getByText('Very High');

    expect(trivialBadge).toHaveClass('bg-green-50');
    expect(veryHighBadge).toHaveClass('bg-red-50');
  });

  it('renders without onEstimate callback', () => {
    render(<StoryPointEstimator />);

    const onePointButton = screen.getByRole('button', {
      name: /1.*Very Simple/,
    });
    fireEvent.click(onePointButton);

    // Should not throw error
    expect(screen.getByText('Selected: 1 story points')).toBeInTheDocument();
  });

  it('shows current estimate on initial render', () => {
    render(
      <StoryPointEstimator currentEstimate={8} onEstimate={mockOnEstimate} />
    );

    expect(screen.getByText('Selected: 8 story points')).toBeInTheDocument();
    expect(screen.getByText('8 Points - Very Complex')).toBeInTheDocument();
  });

  it('updates guidance when different point is selected', () => {
    render(<StoryPointEstimator onEstimate={mockOnEstimate} />);

    const onePointButton = screen.getByRole('button', {
      name: /1.*Very Simple/,
    });
    fireEvent.click(onePointButton);

    expect(screen.getByText('1 Point - Very Simple')).toBeInTheDocument();
    expect(screen.getByText('< 1 day')).toBeInTheDocument();

    const thirteenPointButton = screen.getByRole('button', {
      name: /13.*Extremely Complex/,
    });
    fireEvent.click(thirteenPointButton);

    expect(
      screen.getByText('13 Points - Extremely Complex')
    ).toBeInTheDocument();
    expect(screen.getByText('2-3 weeks')).toBeInTheDocument();
  });
});
