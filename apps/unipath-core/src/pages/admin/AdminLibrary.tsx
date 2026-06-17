import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Book, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Trash2
} from 'lucide-react';

interface BookItem {
  id: string;
  title: string;
  author: string;
  category: string;
  copies: number;
  available: number;
}

interface BookLoan {
  id: string;
  book_title: string;
  borrower_name: string;
  borrower_phone: string;
  loan_date: string;
  return_deadline: string;
  status: 'active' | 'returned' | 'overdue';
}

export default function AdminLibrary() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'books' | 'loans'>('books');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);

  const [books, setBooks] = useState<BookItem[]>([
    { id: '1', title: 'O\'tkan kunlar', author: 'Abdulla Qodiriy', category: 'Klassika', copies: 10, available: 7 },
    { id: '2', title: 'Sariq devni minib', author: 'Xudoyberdi To\'xtaboyev', category: 'Bolalar adabiyoti', copies: 5, available: 2 },
    { id: '3', title: 'Dunyoning ishlari', author: 'O\'tkir Hoshimov', category: 'Roman', copies: 8, available: 8 },
    { id: '4', title: 'Atomic Habits', author: 'James Clear', category: 'Shaxsiy rivojlanish', copies: 12, available: 11 }
  ]);

  const [loans, setLoans] = useState<BookLoan[]>([
    {
      id: '1',
      book_title: 'O\'tkan kunlar',
      borrower_name: 'Jasur Temirov',
      borrower_phone: '+998 90 444 33 22',
      loan_date: '2026-05-10',
      return_deadline: '2026-05-24',
      status: 'active'
    },
    {
      id: '2',
      book_title: 'Sariq devni minib',
      borrower_name: 'Farrux Alimov',
      borrower_phone: '+998 93 111 88 99',
      loan_date: '2026-05-01',
      return_deadline: '2026-05-15',
      status: 'overdue'
    },
    {
      id: '3',
      book_title: 'O\'tkan kunlar',
      borrower_name: 'Nigora Salimova',
      borrower_phone: '+998 94 777 66 11',
      loan_date: '2026-05-05',
      return_deadline: '2026-05-19',
      status: 'returned'
    }
  ]);

  // Form states
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    category: 'Klassika',
    copies: 5,
    available: 5
  });

  const [newLoan, setNewLoan] = useState({
    book_title: 'O\'tkan kunlar',
    borrower_name: '',
    borrower_phone: '',
    loan_date: new Date().toISOString().split('T')[0],
    return_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active' as BookLoan['status']
  });

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author) {
      toast({ title: 'Xatolik', description: 'Kitob nomi va muallifini to\'ldiring!', variant: 'destructive' });
      return;
    }

    const item: BookItem = {
      id: Math.random().toString(36).substring(2, 9),
      ...newBook,
      copies: Number(newBook.copies),
      available: Number(newBook.copies)
    };

    setBooks([item, ...books]);
    setIsBookModalOpen(false);
    setNewBook({ title: '', author: '', category: 'Klassika', copies: 5, available: 5 });
    toast({ title: 'Muvaffaqiyatli', description: 'Yangi kitob katalogga muvaffaqiyatli qo\'shildi!' });
  };

  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoan.borrower_name || !newLoan.borrower_phone) {
      toast({ title: 'Xatolik', description: 'Kitobxon ma\'lumotlarini to\'ldiring!', variant: 'destructive' });
      return;
    }

    // Decrement available count for the selected book
    setBooks(books.map(b => b.title === newLoan.book_title ? { ...b, available: Math.max(0, b.available - 1) } : b));

    const loan: BookLoan = {
      id: Math.random().toString(36).substring(2, 9),
      ...newLoan
    };

    setLoans([loan, ...loans]);
    setIsLoanModalOpen(false);
    setNewLoan({
      book_title: books[0]?.title || 'O\'tkan kunlar',
      borrower_name: '',
      borrower_phone: '',
      loan_date: new Date().toISOString().split('T')[0],
      return_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active'
    });

    toast({ title: 'Muvaffaqiyatli', description: 'Kitob muvaffaqiyatli ijaraga berildi!' });
  };

  const handleReturnBook = (id: string, bookTitle: string) => {
    setLoans(loans.map(l => l.id === id ? { ...l, status: 'returned' } : l));
    // Increment available count
    setBooks(books.map(b => b.title === bookTitle ? { ...b, available: Math.min(b.copies, b.available + 1) } : b));
    toast({ title: 'Muvaffaqiyatli', description: 'Kitob muvaffaqiyatli qaytarib olindi!' });
  };

  const handleDeleteBook = (id: string) => {
    setBooks(books.filter(b => b.id !== id));
    toast({ title: 'O\'chirildi', description: 'Kitob katalogdan o\'chirildi.' });
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLoans = loans.filter(l => 
    l.borrower_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.book_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-indigo-500" />
            Smart Kutubxona Tizimi
          </h1>
          <p className="text-sm text-muted-foreground">
            Kitoblar katalogi, kitobxonlar va ijaraga berilgan kitoblar hisobi
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsBookModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 font-bold"
          >
            <Plus className="w-5 h-5" />
            Kitob Qo'shish
          </Button>
          <Button 
            onClick={() => setIsLoanModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-2 font-bold"
          >
            <Book className="w-5 h-5" />
            Kitob Berish (Loan)
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Jami Kitoblar</CardTitle>
            <Book className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {books.reduce((sum, b) => sum + b.copies, 0)} ta
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Sarlavhalar soni: {books.length} xil</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Ijaradagilar</CardTitle>
            <User className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loans.filter(l => l.status === 'active' || l.status === 'overdue').length} ta
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Kitobxonlar qo'lidagi kitoblar</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Kutubxonada Mavjud</CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {books.reduce((sum, b) => sum + b.available, 0)} ta
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Darhol ijaraga berilishi mumkin bo'lgan</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Muddati o'tganlar</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {loans.filter(l => l.status === 'overdue').length} ta
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Muddati o'tib ketgan kitoblar</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Control */}
      <div className="flex gap-2 border-b border-white/10 pb-px">
        <button
          onClick={() => { setActiveTab('books'); setSearchQuery(''); }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'books' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-muted-foreground'
          }`}
        >
          Kitoblar Katalogi
        </button>
        <button
          onClick={() => { setActiveTab('loans'); setSearchQuery(''); }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'loans' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-muted-foreground'
          }`}
        >
          Ijara va Qaytarishlar
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === 'books' ? "Kitob nomi, muallifi..." : "Kitobxon ismi, kitob..."}
            className="pl-9 bg-background/50 border-white/10 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tables based on tabs */}
      {activeTab === 'books' ? (
        <Card className="glass-card border-white/5 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-foreground">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5">
                <tr>
                  <th className="px-6 py-4">Kitob nomi va muallifi</th>
                  <th className="px-6 py-4">Kategoriya</th>
                  <th className="px-6 py-4 text-center">Umumiy nusxalar</th>
                  <th className="px-6 py-4 text-center">Kutubxonada qolgan</th>
                  <th className="px-6 py-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBooks.map((b) => (
                  <tr key={b.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{b.title}</div>
                      <div className="text-xs text-muted-foreground">{b.author}</div>
                    </td>
                    <td className="px-6 py-4">{b.category}</td>
                    <td className="px-6 py-4 text-center font-semibold">{b.copies}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        b.available > 2 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {b.available} ta
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => handleDeleteBook(b.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:bg-red-500/10 h-8 p-2 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="glass-card border-white/5 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-foreground">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5">
                <tr>
                  <th className="px-6 py-4">Kitobxon va Telefon</th>
                  <th className="px-6 py-4">Kitob nomi</th>
                  <th className="px-6 py-4">Berilgan sana</th>
                  <th className="px-6 py-4">Qaytarish muddati</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLoans.map((l) => (
                  <tr key={l.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold">{l.borrower_name}</div>
                      <div className="text-xs text-muted-foreground">{l.borrower_phone}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">{l.book_title}</td>
                    <td className="px-6 py-4">{l.loan_date}</td>
                    <td className="px-6 py-4 font-semibold">{l.return_deadline}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        l.status === 'returned' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        l.status === 'overdue' ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {l.status === 'returned' ? 'Qaytarilgan' : l.status === 'overdue' ? 'Muddati o\'tgan' : 'Ijara (Faol)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {l.status !== 'returned' && (
                        <Button
                          onClick={() => handleReturnBook(l.id, l.book_title)}
                          size="sm"
                          variant="outline"
                          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 h-8 text-xs rounded-lg"
                        >
                          Qaytarib Olish
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* New Book Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md glass-card border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-indigo-400">
                <Book className="w-6 h-6 text-indigo-500" />
                Yangi kitob qo'shish
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddBook} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="book_title">Kitob nomi *</Label>
                  <Input
                    id="book_title"
                    required
                    placeholder="Masalan: O'tkan kunlar"
                    className="bg-background/50 border-white/10 rounded-lg"
                    value={newBook.title}
                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="book_author">Muallif *</Label>
                  <Input
                    id="book_author"
                    required
                    placeholder="Masalan: Abdulla Qodiriy"
                    className="bg-background/50 border-white/10 rounded-lg"
                    value={newBook.author}
                    onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="book_category">Kategoriya</Label>
                    <select
                      id="book_category"
                      className="w-full bg-background border border-white/10 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none"
                      value={newBook.category}
                      onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                    >
                      <option value="Klassika">Klassika</option>
                      <option value="Roman">Roman</option>
                      <option value="Bolalar adabiyoti">Bolalar adabiyoti</option>
                      <option value="Shaxsiy rivojlanish">Shaxsiy rivojlanish</option>
                      <option value="Darslik / Ilmiy">Darslik / Ilmiy</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="book_copies">Nusxalar soni</Label>
                    <Input
                      id="book_copies"
                      type="number"
                      min={1}
                      className="bg-background/50 border-white/10 rounded-lg"
                      value={newBook.copies}
                      onChange={(e) => setNewBook({ ...newBook, copies: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsBookModalOpen(false)}>
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 font-bold">
                    Katalogga Qo'shish
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Loan Modal */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md glass-card border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-purple-400">
                <BookOpen className="w-6 h-6 text-purple-500" />
                Kitobxon uchun ijara ochish
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddLoan} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loan_book">Kitobni tanlang *</Label>
                  <select
                    id="loan_book"
                    className="w-full bg-background border border-white/10 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none"
                    value={newLoan.book_title}
                    onChange={(e) => setNewLoan({ ...newLoan, book_title: e.target.value })}
                  >
                    {books.map(b => (
                      <option key={b.id} value={b.title} disabled={b.available === 0}>
                        {b.title} (Qolgan nusxa: {b.available} ta)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="borrower_name">Kitobxonning ismi *</Label>
                  <Input
                    id="borrower_name"
                    required
                    placeholder="Masalan: Sardorbek Alimov"
                    className="bg-background/50 border-white/10 rounded-lg"
                    value={newLoan.borrower_name}
                    onChange={(e) => setNewLoan({ ...newLoan, borrower_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="borrower_phone">Telefon raqami *</Label>
                  <Input
                    id="borrower_phone"
                    required
                    placeholder="+998 90 123 45 67"
                    className="bg-background/50 border-white/10 rounded-lg"
                    value={newLoan.borrower_phone}
                    onChange={(e) => setNewLoan({ ...newLoan, borrower_phone: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loan_date">Berilgan sana</Label>
                    <Input
                      id="loan_date"
                      type="date"
                      className="bg-background/50 border-white/10 rounded-lg text-foreground"
                      value={newLoan.loan_date}
                      onChange={(e) => setNewLoan({ ...newLoan, loan_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="return_deadline">Qaytarish muddati</Label>
                    <Input
                      id="return_deadline"
                      type="date"
                      className="bg-background/50 border-white/10 rounded-lg text-foreground"
                      value={newLoan.return_deadline}
                      onChange={(e) => setNewLoan({ ...newLoan, return_deadline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsLoanModalOpen(false)}>
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 font-bold">
                    Ijara shartnomasini ochish
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
