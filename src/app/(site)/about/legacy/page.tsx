import { Instrument_Serif } from 'next/font/google';

const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

const legacyData = [
  {
    year: '2014-15',
    secretary: 'Shoeb Syed',
    jointSecretary: 'Zen Manne',
    treasurer: '',
    clubRep: '',
    convener: '',
  },
  {
    year: '2015-16',
    secretary: 'Aayush Rathi',
    jointSecretary: 'Anuj Saxena',
    treasurer: '',
    clubRep: '',
    convener: '',
  },
  {
    year: '2016-17',
    secretary: 'Anuj Saxena',
    jointSecretary: 'Shivang Dixit',
    treasurer: '',
    clubRep: '',
    convener: '',
  },
  {
    year: '2017-18',
    secretary: 'Ameen Shaikh',
    jointSecretary: 'Kushagra Saxena',
    treasurer: 'Priyash Barya',
    clubRep: '',
    convener: 'Pranjal Gupta',
  },
  {
    year: '2018-19',
    secretary: 'Priyash Barya',
    jointSecretary: 'Shubhang Srivastava',
    treasurer: 'Soumyadeep Basu',
    clubRep: 'Prathmesh Mahalle',
    convener: '',
  },
  {
    year: '2019-20',
    secretary: 'Shubhang Srivastava',
    jointSecretary: 'Adit Andrew Mohanty',
    treasurer: 'Debadarshee Das Mohapatra',
    clubRep: 'Kartheek Nadimpalli',
    convener: 'Soumyadeep Basu',
  },
  {
    year: '2020-21',
    secretary: 'Adit Andrew Mohanty',
    jointSecretary: 'Kartheek Nadimpalli',
    treasurer: 'Sai Sreekar Kallem',
    clubRep: 'Nishant Kumar',
    convener: 'Debadarshee Das Mohapatra',
  },
  {
    year: '2021-22',
    secretary: 'Sai Sreekar Kallem',
    jointSecretary: 'CV Shyam Rahul',
    treasurer: 'Shreyash Mahapatra',
    clubRep: 'Archis Sahu',
    convener: 'Nishant Kumar',
  },
  {
    year: '2022-23',
    secretary: 'Archis Sahu',
    jointSecretary: 'Anant Nambiar',
    treasurer: 'Shreyas Devulapalli',
    clubRep: 'Nikhita Upadhyaya',
    convener: 'Shreyash Mahapatra',
  },
  {
    year: '2023-24',
    secretary: 'Paul Stefen J A',
    jointSecretary: 'Pranay Vajrapu',
    treasurer: 'Yash Kantamneni',
    clubRep: 'Preetam Basarahalli',
    convener: 'Shreyash Sinha',
  },
  {
    year: '2024-25',
    secretary: 'Pranay Vajrapu',
    jointSecretary: 'Sai Ashish Vure',
    treasurer: 'Mufidh Muhsin',
    clubRep: 'Aswanth Ganesan',
    convener: 'Harshid S',
  },
  {
    year: '2025-26',
    secretary: 'Aswanth Ganesan',
    jointSecretary: 'Harshid S',
    treasurer: 'Shreya Meher',
    clubRep: 'Sachin Siva Atluri',
    convener: 'Tarun Manick Murugesan',
  },
];

const columns: { key: keyof (typeof legacyData)[number]; label: string }[] = [
  { key: 'year', label: 'Year' },
  { key: 'secretary', label: 'Secretary' },
  { key: 'jointSecretary', label: 'Joint Secretary' },
  { key: 'treasurer', label: 'Treasurer' },
  { key: 'convener', label: 'Catharsis Convener' },
  { key: 'clubRep', label: 'Club Representative' },
];

export default function LegacyPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className={`text-9xl mb-10 ${instrument.className}`}>Legacy</h1>

      {/* Intro */}
      <section className="mb-12">
        <p className="text-l sm:text-xl text-gray-300 leading-relaxed max-w-5xl">
          Over the years, the Movie Club has been helmed by passionate and visionary students
          dedicated to the growth of cinema culture on campus. Here&apos;s a look at the PORs of
          past years who have who carried the torch forward, year after year.
        </p>
      </section>

      {/* Legacy Table */}
      <section className="overflow-auto border border-gray-700 rounded-xl">
        <table className="w-full text-left text-gray-300 text-sm md:text-base table-auto">
          <thead className="bg-gray-800 text-white uppercase text-xs md:text-sm">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="p-4">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {legacyData.map((row, i) => (
              <tr key={i} className="hover:bg-gray-800/50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="p-4 whitespace-nowrap">
                    {row[col.key] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
