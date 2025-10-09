// app/films/components/FiltersBar.tsx
'use client';
import StyledSelect from './StyledSelect';

interface Props {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  sortOrder: 'newest' | 'oldest';
  setSortOrder: (val: 'newest' | 'oldest') => void;
  selectedYear: string | null;
  setSelectedYear: (val: string | null) => void;
  selectedCredit: string | null;
  setSelectedCredit: (val: string | null) => void;
  uniqueYears: string[];
  uniqueCredits: string[];
}

export default function FiltersBar({
  searchTerm,
  setSearchTerm,
  sortOrder,
  setSortOrder,
  selectedYear,
  setSelectedYear,
  selectedCredit,
  setSelectedCredit,
  uniqueYears,
  uniqueCredits,
}: Props) {
  return (
    <div className="px-4 md:px-4 mb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-white font-gotham">
        <input
          type="text"
          placeholder="Search films..."
          className="w-full md:w-1/2 bg-transparent border border-white placeholder-gray-400 px-5 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full md:w-auto">
          <StyledSelect
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="w-full sm:w-auto"
          >
            <option className="text-black" value="newest">
              Newest
            </option>
            <option className="text-black" value="oldest">
              Oldest
            </option>
          </StyledSelect>

          <StyledSelect
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(e.target.value || null)}
            className="w-full sm:w-auto"
          >
            <option className="text-black" value="">
              All Years
            </option>
            {uniqueYears.map((year) => (
              <option key={year} className="text-black" value={year}>
                {year}
              </option>
            ))}
          </StyledSelect>

          <StyledSelect
            value={selectedCredit || ''}
            onChange={(e) => setSelectedCredit(e.target.value || null)}
            className="w-full sm:w-auto"
          >
            <option className="text-black" value="">
              All Credits
            </option>
            {uniqueCredits.map((credit) => (
              <option key={credit} className="text-black" value={credit}>
                {credit}
              </option>
            ))}
          </StyledSelect>
        </div>
      </div>
    </div>
  );
}
