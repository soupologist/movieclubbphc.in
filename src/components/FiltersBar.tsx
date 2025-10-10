'use client';
import classNames from 'classnames';
import StyledSelect from './StyledSelect';

interface Props {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  sortOrder: 'newest' | 'oldest';
  setSortOrder: (val: 'newest' | 'oldest') => void;
  selectedYear: string | null;
  setSelectedYear: (val: string | null) => void;
  selectedOrigins: string[];
  setSelectedOrigins: (val: string[]) => void;
  selectedStatuses: string[];
  setSelectedStatuses: (val: string[]) => void;
  uniqueYears: string[];
}

export default function FiltersBar({
  searchTerm,
  setSearchTerm,
  sortOrder,
  setSortOrder,
  selectedYear,
  setSelectedYear,
  selectedOrigins,
  setSelectedOrigins,
  selectedStatuses,
  setSelectedStatuses,
  uniqueYears,
}: Props) {
  const toggleOrigin = (origin: string) => {
    if (selectedOrigins.includes(origin)) {
      setSelectedOrigins(selectedOrigins.filter((o) => o !== origin));
    } else {
      setSelectedOrigins([...selectedOrigins, origin]);
    }
  };

  const toggleShelved = () => {
    if (selectedStatuses.includes('shelved')) {
      setSelectedStatuses(selectedStatuses.filter((s) => s !== 'shelved'));
    } else {
      setSelectedStatuses([...selectedStatuses, 'shelved']);
    }
  };

  return (
    <div className="mb-12 px-4 md:px-0 space-y-3">
      {/* Top Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <input
          type="text"
          placeholder="Search films or tags..."
          className="flex-grow bg-transparent border border-white placeholder-gray-400 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-3 mt-2 md:mt-0">
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
        </div>
      </div>

      {/* Bottom Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Origins */}
        <div className="flex gap-2">
          {['clubFilm', 'clubProject', 'clubAssociate'].map((origin) => (
            <button
              key={origin}
              onClick={() => toggleOrigin(origin)}
              className={classNames(
                'px-4 py-1 rounded border text-sm',
                selectedOrigins.includes(origin)
                  ? 'bg-white text-black'
                  : 'bg-transparent border-white text-white'
              )}
            >
              {origin === 'clubFilm'
                ? 'Club Films'
                : origin === 'clubProject'
                  ? 'Club Non-films'
                  : 'Associate Films'}
            </button>
          ))}
        </div>

        {/* Shelved */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedStatuses.includes('shelved')}
            onChange={toggleShelved}
            className="w-4 h-4"
          />
          <label className="text-white">View Shelved</label>
        </div>
      </div>
    </div>
  );
}
