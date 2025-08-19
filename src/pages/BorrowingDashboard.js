import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import ReturnProcessDialog from '../components/lending/ReturnProcessDialog';
import { useToast } from '../hooks/use-toast';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Package,
  MapPin,
  ArrowLeft,
  History,
} from 'lucide-react';

const BorrowingDashboard = () => {
  const [activeTransactions, setActiveTransactions] = useState([]);
  const [overdueTransactions, setOverdueTransactions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('active');
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      // Fetch active transactions
      const activeResponse = await fetch(
        '/api/v1/lending-transactions/my-transactions/list?status=active',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const activeData = await activeResponse.json();

      // Fetch overdue transactions
      const overdueResponse = await fetch(
        '/api/v1/lending-transactions/my-transactions/list?status=overdue',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const overdueData = await overdueResponse.json();

      // Fetch history
      const historyResponse = await fetch(
        '/api/v1/lending-transactions/history?limit=20',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const historyData = await historyResponse.json();

      if (activeData.success) setActiveTransactions(activeData.data);
      if (overdueData.success) setOverdueTransactions(overdueData.data);
      if (historyData.success) setHistory(historyData.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your borrowing information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReturnClick = transaction => {
    setSelectedTransaction(transaction);
    setReturnDialogOpen(true);
  };

  const handleReturnSuccess = () => {
    fetchTransactions(); // Refresh the data
  };

  const getDaysUntilDue = dueDate => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = transaction => {
    const daysUntilDue = getDaysUntilDue(transaction.dueDate);

    if (transaction.status === 'overdue') {
      return <Badge variant='destructive'>Overdue</Badge>;
    } else if (transaction.status === 'returned') {
      return <Badge variant='default'>Returned</Badge>;
    } else if (daysUntilDue <= 3) {
      return <Badge variant='secondary'>Due Soon</Badge>;
    } else {
      return <Badge variant='outline'>Active</Badge>;
    }
  };

  const TransactionCard = ({ transaction, showReturnButton = false }) => {
    const daysUntilDue = getDaysUntilDue(transaction.dueDate);
    const isOverdue = transaction.status === 'overdue' || daysUntilDue < 0;
    const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;

    return (
      <Card
        className={`${isOverdue ? 'border-red-200 bg-red-50' : isDueSoon ? 'border-yellow-200 bg-yellow-50' : ''}`}
      >
        <CardHeader className='pb-3'>
          <div className='flex justify-between items-start'>
            <CardTitle className='text-lg font-semibold'>
              {transaction.productName || transaction.product_name}
            </CardTitle>
            {getStatusBadge(transaction)}
          </div>
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <span className='font-medium'>
              {transaction.productBrand || transaction.brand}
            </span>
            {transaction.productModel && (
              <span>• {transaction.productModel}</span>
            )}
          </div>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div className='flex items-center gap-2'>
              <Calendar className='w-4 h-4 text-gray-500' />
              <div>
                <div className='font-medium'>Borrowed</div>
                <div className='text-gray-600'>
                  {new Date(transaction.lendDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Clock className='w-4 h-4 text-gray-500' />
              <div>
                <div className='font-medium'>Due Date</div>
                <div
                  className={`${isOverdue ? 'text-red-600 font-medium' : isDueSoon ? 'text-yellow-600 font-medium' : 'text-gray-600'}`}
                >
                  {new Date(transaction.dueDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {transaction.status !== 'returned' && (
            <div className='flex items-center gap-2 text-sm'>
              {isOverdue ? (
                <div className='flex items-center gap-2 text-red-600'>
                  <AlertTriangle className='w-4 h-4' />
                  <span className='font-medium'>
                    {Math.abs(daysUntilDue)} day(s) overdue
                  </span>
                </div>
              ) : isDueSoon ? (
                <div className='flex items-center gap-2 text-yellow-600'>
                  <Clock className='w-4 h-4' />
                  <span className='font-medium'>
                    Due in {daysUntilDue} day(s)
                  </span>
                </div>
              ) : (
                <div className='flex items-center gap-2 text-gray-600'>
                  <Clock className='w-4 h-4' />
                  <span>{daysUntilDue} day(s) remaining</span>
                </div>
              )}
            </div>
          )}

          {transaction.returnDate && (
            <div className='flex items-center gap-2 text-sm text-green-600'>
              <CheckCircle className='w-4 h-4' />
              <span>
                Returned on{' '}
                {new Date(transaction.returnDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {transaction.notes && (
            <div className='text-sm text-gray-600 bg-gray-50 p-2 rounded'>
              <strong>Notes:</strong> {transaction.notes}
            </div>
          )}

          {showReturnButton && transaction.status !== 'returned' && (
            <div className='pt-2'>
              <Button
                onClick={() => handleReturnClick(transaction)}
                className='w-full'
                size='sm'
              >
                <ArrowLeft className='w-4 h-4 mr-2' />
                Return Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='flex justify-center items-center h-64'>
          <div className='text-lg'>Loading your borrowing information...</div>
        </div>
      </div>
    );
  }

  const totalActive = activeTransactions.length;
  const totalOverdue = overdueTransactions.length;
  const dueSoonCount = activeTransactions.filter(
    t => getDaysUntilDue(t.dueDate) <= 3
  ).length;

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2'>My Borrowing Dashboard</h1>
        <p className='text-gray-600'>
          Manage your borrowed items and view your lending history
        </p>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Active Loans
                </p>
                <p className='text-2xl font-bold'>{totalActive}</p>
              </div>
              <Package className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Due Soon</p>
                <p className='text-2xl font-bold text-yellow-600'>
                  {dueSoonCount}
                </p>
              </div>
              <Clock className='h-8 w-8 text-yellow-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Overdue</p>
                <p className='text-2xl font-bold text-red-600'>
                  {totalOverdue}
                </p>
              </div>
              <AlertTriangle className='h-8 w-8 text-red-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {totalOverdue > 0 && (
        <Alert className='mb-6 border-red-200 bg-red-50'>
          <AlertTriangle className='h-4 w-4 text-red-600' />
          <AlertDescription className='text-red-800'>
            You have {totalOverdue} overdue item(s). Please return them as soon
            as possible to avoid penalties.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='active'>Active ({totalActive})</TabsTrigger>
          <TabsTrigger value='overdue'>Overdue ({totalOverdue})</TabsTrigger>
          <TabsTrigger value='history'>History ({history.length})</TabsTrigger>
        </TabsList>

        <TabsContent value='active' className='mt-6'>
          {activeTransactions.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {activeTransactions.map(transaction => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  showReturnButton={true}
                />
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <Package className='mx-auto h-12 w-12 text-gray-400 mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No Active Loans
              </h3>
              <p className='text-gray-600 mb-4'>
                You don't have any items currently borrowed.
              </p>
              <Button onClick={() => (window.location.href = '/lending')}>
                Browse Available Items
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value='overdue' className='mt-6'>
          {overdueTransactions.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {overdueTransactions.map(transaction => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  showReturnButton={true}
                />
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <CheckCircle className='mx-auto h-12 w-12 text-green-400 mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No Overdue Items
              </h3>
              <p className='text-gray-600'>
                Great job! You don't have any overdue items.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value='history' className='mt-6'>
          {history.length > 0 ? (
            <div className='space-y-4'>
              {history.map(transaction => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  showReturnButton={false}
                />
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <History className='mx-auto h-12 w-12 text-gray-400 mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No History
              </h3>
              <p className='text-gray-600'>
                Your borrowing history will appear here.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Return Process Dialog */}
      <ReturnProcessDialog
        isOpen={returnDialogOpen}
        onClose={() => setReturnDialogOpen(false)}
        transaction={selectedTransaction}
        onReturnSuccess={handleReturnSuccess}
      />
    </div>
  );
};

export default BorrowingDashboard;
