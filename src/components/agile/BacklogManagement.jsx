import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Plus, Search, Filter, LayoutGrid, List } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import EpicCard from './EpicCard';
import UserStoryCard from './UserStoryCard';
import EpicForm from './EpicForm';
import UserStoryForm from './UserStoryForm';

const BacklogManagement = () => {
  const [epics, setEpics] = useState([]);
  const [stories, setStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEpic, setSelectedEpic] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Form states
  const [isEpicFormOpen, setIsEpicFormOpen] = useState(false);
  const [isStoryFormOpen, setIsStoryFormOpen] = useState(false);
  const [editingEpic, setEditingEpic] = useState(null);
  const [editingStory, setEditingStory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load initial data
  useEffect(() => {
    loadBacklogData();
  }, []);

  // Filter stories based on search and filters
  useEffect(() => {
    let filtered = [...stories];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        story =>
          story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          story.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Epic filter
    if (selectedEpic !== 'all') {
      filtered = filtered.filter(story => story.epic === selectedEpic);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(story => story.status === selectedStatus);
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(story => story.priority === selectedPriority);
    }

    setFilteredStories(filtered);
  }, [stories, searchTerm, selectedEpic, selectedStatus, selectedPriority]);

  const loadBacklogData = async () => {
    try {
      // Mock data for now - replace with actual API calls
      const mockEpics = [
        {
          id: '1',
          title: 'User Authentication System',
          description: 'Complete user authentication and authorization system',
          businessValue: 'Secure access control and user management',
          status: 'in-progress',
          targetSprint: 2,
          stories: [],
        },
        {
          id: '2',
          title: 'Product Catalog Management',
          description: 'Electronics and office components catalog with search',
          businessValue: 'Easy product discovery and management',
          status: 'planned',
          targetSprint: 4,
          stories: [],
        },
      ];

      const mockStories = [
        {
          id: '1',
          title:
            'As a user, I want to register an account, so that I can access the system',
          description: 'User registration with email verification',
          acceptanceCriteria: [
            'WHEN user provides valid email and password THEN account is created',
            'WHEN user submits form THEN verification email is sent',
            'WHEN user clicks verification link THEN account is activated',
          ],
          storyPoints: 5,
          priority: 'high',
          status: 'in-progress',
          assignee: 'John Doe',
          epic: 'User Authentication System',
        },
        {
          id: '2',
          title:
            'As a user, I want to login to my account, so that I can access protected features',
          description: 'User login with email and password',
          acceptanceCriteria: [
            'WHEN user provides valid credentials THEN they are logged in',
            'WHEN user provides invalid credentials THEN error message is shown',
            'WHEN user is logged in THEN they can access protected pages',
          ],
          storyPoints: 3,
          priority: 'high',
          status: 'todo',
          assignee: 'Jane Smith',
          epic: 'User Authentication System',
        },
        {
          id: '3',
          title:
            'As an admin, I want to add products to catalog, so that users can browse them',
          description: 'Product management interface for administrators',
          acceptanceCriteria: [
            'WHEN admin fills product form THEN product is added to catalog',
            'WHEN admin uploads images THEN they are stored and displayed',
            'WHEN admin sets categories THEN products are properly categorized',
          ],
          storyPoints: 8,
          priority: 'medium',
          status: 'backlog',
          assignee: '',
          epic: 'Product Catalog Management',
        },
      ];

      setEpics(mockEpics);
      setStories(mockStories);
    } catch (error) {
      console.error('Error loading backlog data:', error);
    }
  };

  const handleDragEnd = event => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setFilteredStories(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Update the main stories array as well
        setStories(prevStories => {
          const updatedStories = [...prevStories];
          const storyToMove = updatedStories.find(s => s.id === active.id);
          const targetStory = updatedStories.find(s => s.id === over.id);

          if (storyToMove && targetStory) {
            const oldIdx = updatedStories.findIndex(s => s.id === active.id);
            const newIdx = updatedStories.findIndex(s => s.id === over.id);
            return arrayMove(updatedStories, oldIdx, newIdx);
          }

          return updatedStories;
        });

        return newOrder;
      });
    }
  };

  const handleCreateEpic = async epicData => {
    setIsLoading(true);
    try {
      const newEpic = {
        id: Date.now().toString(),
        ...epicData,
        stories: [],
      };
      setEpics(prev => [...prev, newEpic]);
      setIsEpicFormOpen(false);
    } catch (error) {
      console.error('Error creating epic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEpic = async epicData => {
    setIsLoading(true);
    try {
      setEpics(prev =>
        prev.map(epic =>
          epic.id === editingEpic.id ? { ...epic, ...epicData } : epic
        )
      );
      setIsEpicFormOpen(false);
      setEditingEpic(null);
    } catch (error) {
      console.error('Error updating epic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEpic = async epicId => {
    if (window.confirm('Are you sure you want to delete this epic?')) {
      try {
        setEpics(prev => prev.filter(epic => epic.id !== epicId));
        // Remove epic reference from stories
        setStories(prev =>
          prev.map(story =>
            story.epic === epics.find(e => e.id === epicId)?.title
              ? { ...story, epic: '' }
              : story
          )
        );
      } catch (error) {
        console.error('Error deleting epic:', error);
      }
    }
  };

  const handleCreateStory = async storyData => {
    setIsLoading(true);
    try {
      const newStory = {
        id: Date.now().toString(),
        ...storyData,
        tasks: [],
      };
      setStories(prev => [...prev, newStory]);
      setIsStoryFormOpen(false);
    } catch (error) {
      console.error('Error creating story:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStory = async storyData => {
    setIsLoading(true);
    try {
      setStories(prev =>
        prev.map(story =>
          story.id === editingStory.id ? { ...story, ...storyData } : story
        )
      );
      setIsStoryFormOpen(false);
      setEditingStory(null);
    } catch (error) {
      console.error('Error updating story:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStory = async storyId => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      try {
        setStories(prev => prev.filter(story => story.id !== storyId));
      } catch (error) {
        console.error('Error deleting story:', error);
      }
    }
  };

  const handleEditEpic = epic => {
    setEditingEpic(epic);
    setIsEpicFormOpen(true);
  };

  const handleEditStory = story => {
    setEditingStory(story);
    setIsStoryFormOpen(true);
  };

  const totalStoryPoints = filteredStories.reduce(
    (sum, story) => sum + (story.storyPoints || 0),
    0
  );
  const completedStoryPoints = filteredStories
    .filter(story => story.status === 'done')
    .reduce((sum, story) => sum + (story.storyPoints || 0), 0);

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Product Backlog</h1>
          <p className='text-gray-600 mt-1'>
            Manage epics and user stories for your project
          </p>
        </div>
        <div className='flex gap-2'>
          <Button onClick={() => setIsEpicFormOpen(true)}>
            <Plus className='h-4 w-4 mr-2' />
            New Epic
          </Button>
          <Button onClick={() => setIsStoryFormOpen(true)}>
            <Plus className='h-4 w-4 mr-2' />
            New Story
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-blue-600'>
              {epics.length}
            </div>
            <div className='text-sm text-gray-600'>Total Epics</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-green-600'>
              {stories.length}
            </div>
            <div className='text-sm text-gray-600'>Total Stories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-purple-600'>
              {totalStoryPoints}
            </div>
            <div className='text-sm text-gray-600'>Story Points</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-orange-600'>
              {totalStoryPoints > 0
                ? Math.round((completedStoryPoints / totalStoryPoints) * 100)
                : 0}
              %
            </div>
            <div className='text-sm text-gray-600'>Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Epics Section */}
      <div>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>Epics</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {epics.map(epic => (
            <EpicCard
              key={epic.id}
              epic={epic}
              onEdit={handleEditEpic}
              onDelete={handleDeleteEpic}
              onViewStories={epic => setSelectedEpic(epic.title)}
            />
          ))}
        </div>
      </div>

      {/* Filters and Search */}
      <div className='flex flex-col sm:flex-row gap-4 items-center justify-between'>
        <div className='flex flex-1 gap-4 items-center'>
          <div className='relative flex-1 max-w-md'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
            <Input
              placeholder='Search stories...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>

          <select
            value={selectedEpic}
            onChange={e => setSelectedEpic(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-md text-sm'
          >
            <option value='all'>All Epics</option>
            {epics.map(epic => (
              <option key={epic.id} value={epic.title}>
                {epic.title}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-md text-sm'
          >
            <option value='all'>All Status</option>
            <option value='backlog'>Backlog</option>
            <option value='todo'>To Do</option>
            <option value='in-progress'>In Progress</option>
            <option value='review'>Review</option>
            <option value='done'>Done</option>
          </select>

          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-md text-sm'
          >
            <option value='all'>All Priority</option>
            <option value='high'>High</option>
            <option value='medium'>Medium</option>
            <option value='low'>Low</option>
          </select>
        </div>

        <div className='flex gap-2'>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size='icon'
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className='h-4 w-4' />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size='icon'
            onClick={() => setViewMode('list')}
          >
            <List className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* User Stories Section */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-semibold text-gray-900'>
            User Stories ({filteredStories.length})
          </h2>
          {selectedEpic !== 'all' && (
            <Badge variant='outline' className='text-sm'>
              Filtered by: {selectedEpic}
            </Badge>
          )}
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredStories.map(story => story.id)}
            strategy={verticalListSortingStrategy}
          >
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-4'
              }
            >
              {filteredStories.map(story => (
                <UserStoryCard
                  key={story.id}
                  story={story}
                  onEdit={handleEditStory}
                  onDelete={handleDeleteStory}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {filteredStories.length === 0 && (
          <Card className='p-8 text-center'>
            <CardContent>
              <p className='text-gray-500'>
                No stories found matching your criteria.
              </p>
              <Button className='mt-4' onClick={() => setIsStoryFormOpen(true)}>
                Create Your First Story
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Forms */}
      <EpicForm
        isOpen={isEpicFormOpen}
        onClose={() => {
          setIsEpicFormOpen(false);
          setEditingEpic(null);
        }}
        onSubmit={editingEpic ? handleUpdateEpic : handleCreateEpic}
        epic={editingEpic}
        isLoading={isLoading}
      />

      <UserStoryForm
        isOpen={isStoryFormOpen}
        onClose={() => {
          setIsStoryFormOpen(false);
          setEditingStory(null);
        }}
        onSubmit={editingStory ? handleUpdateStory : handleCreateStory}
        story={editingStory}
        epics={epics}
        isLoading={isLoading}
      />
    </div>
  );
};

export default BacklogManagement;
