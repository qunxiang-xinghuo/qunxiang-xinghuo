import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BottomNav from '@/components/layout/BottomNav';

const mockUsePathname = vi.fn();
const mockPush = vi.fn();
const mockUseRouter = vi.fn(() => ({
  push: mockPush,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => mockUseRouter(),
}));

describe('BottomNav Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
    mockPush.mockClear();
  });

  it('should render all navigation items', () => {
    render(<BottomNav />);

    expect(screen.getByText('发现')).toBeInTheDocument();
    expect(screen.getByText('素材库')).toBeInTheDocument();
    expect(screen.getByText('故事')).toBeInTheDocument();
    expect(screen.getByText('我的')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });

  it('should highlight active item based on pathname', () => {
    mockUsePathname.mockReturnValue('/library');
    
    render(<BottomNav />);

    const activeItem = screen.getByText('素材库');
    const inactiveItem = screen.getByText('发现');

    expect(activeItem).toHaveClass('text-xh-gold', 'font-medium');
    expect(inactiveItem).toHaveClass('text-white/30');
  });

  it('should call router.push when item is clicked', () => {
    render(<BottomNav />);

    const libraryButton = screen.getByText('素材库');
    fireEvent.click(libraryButton);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/library');
  });

  it('should navigate to story when clicked', () => {
    render(<BottomNav />);

    const storyButton = screen.getByText('故事');
    fireEvent.click(storyButton);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/story');
  });

  it('should apply correct styling for active items', () => {
    mockUsePathname.mockReturnValue('/story');
    
    render(<BottomNav />);

    const activeIcon = screen.getByText('故事').previousElementSibling;
    expect(activeIcon).toHaveClass('text-xh-gold');

    const activeText = screen.getByText('故事');
    expect(activeText).toHaveClass('text-xh-gold', 'font-medium');
  });

  it('should apply correct styling for inactive items', () => {
    render(<BottomNav />);

    const inactiveIcons = [
      screen.getByText('素材库').previousElementSibling,
      screen.getByText('故事').previousElementSibling,
      screen.getByText('我的').previousElementSibling,
    ];

    inactiveIcons.forEach(icon => {
      expect(icon).toHaveClass('text-white/30');
    });

    const inactiveTexts = ['素材库', '故事', '我的'];
    inactiveTexts.forEach(text => {
      const element = screen.getByText(text);
      expect(element).toHaveClass('text-white/30');
    });
  });

  it('should render correct icons for each item', () => {
    render(<BottomNav />);

    const icons = document.querySelectorAll('svg');
    expect(icons).toHaveLength(4);

    icons.forEach(icon => {
      expect(icon).toBeInTheDocument();
    });
  });

  it('should have proper button styling', () => {
    render(<BottomNav />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('flex', 'flex-col', 'items-center', 'gap-0.5', 'transition-colors');
    });
  });

  it('should handle hover states', () => {
    render(<BottomNav />);

    const inactiveIcon = screen.getByText('素材库').previousElementSibling;
    expect(inactiveIcon).toHaveClass('hover:text-white/50');

    const inactiveText = screen.getByText('素材库');
    expect(inactiveText).toHaveClass('hover:text-white/50');
  });

  it('should work correctly with all pathnames', () => {
    const paths = ['/', '/library', '/story', '/profile'];
    
    paths.forEach(path => {
      mockUsePathname.mockReturnValue(path);
      const { unmount } = render(<BottomNav />);
      
      const activeItem = screen.getByText(
        path === '/' ? '发现' :
        path === '/library' ? '素材库' :
        path === '/story' ? '故事' : '我的'
      );
      
      expect(activeItem).toHaveClass('text-xh-gold');
      unmount();
    });
  });
});
