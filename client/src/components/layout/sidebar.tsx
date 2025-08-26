import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  FileText, 
  Search, 
  Quote, 
  Settings,
  Newspaper
} from "lucide-react";
import ThemeToggle from "@/components/common/theme-toggle";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Stories", href: "/stories", icon: FileText },
  { name: "Search Queries", href: "/queries", icon: Search },
  { name: "Citations", href: "/citations", icon: Quote },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Newspaper className="text-white text-sm" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">LLM Citation Tracker</h1>
          </div>
          <ThemeToggle />
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                isActive
                  ? "bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
              data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100" data-testid="text-user-name">Admin User</p>
            <p className="text-xs text-slate-500 dark:text-slate-400" data-testid="text-user-role">Citation Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}
