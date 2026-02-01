import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env file');
  process.exit(1);
}

async function seedFOTW() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();

    // Clear existing FOTW data
    await db.collection('fotwfilms').deleteMany({});
    await db.collection('fotwusers').deleteMany({});
    await db.collection('fotwratings').deleteMany({});
    await db.collection('fotwcomments').deleteMany({});
    console.log('🗑️  Cleared existing FOTW data');

    // Add Titanic as the current film
    const titanicFilm = {
      title: 'Titanic',
      posterUrl:
        'https://m.media-amazon.com/images/M/MV5BMDdmZGU3NDQtY2E5My00ZTliLWIzOTUtMTY4ZGI1YjdiNjk3XkEyXkFqcGdeQXVyNTA4NzY1MzY@._V1_FMjpg_UX1000_.jpg',
      driveLink: 'https://drive.google.com/file/d/your-drive-link-here/view',
      addedBy: 'ronilborah@gmail.com',
      active: true,
      createdAt: new Date(),
    };

    const filmResult = await db.collection('fotwfilms').insertOne(titanicFilm);
    console.log('🎬 Added Titanic as Film of the Week');

    // Add mock users
    const mockUsers = [
      {
        email: 'alice@hyderabad.bits-pilani.ac.in',
        name: 'Alice Johnson',
        image: 'https://i.pravatar.cc/150?img=1',
        ratingsCount: 12,
        createdAt: new Date(),
      },
      {
        email: 'bob@hyderabad.bits-pilani.ac.in',
        name: 'Bob Smith',
        image: 'https://i.pravatar.cc/150?img=2',
        ratingsCount: 12,
        createdAt: new Date(),
      },
      {
        email: 'charlie@hyderabad.bits-pilani.ac.in',
        name: 'Charlie Davis',
        image: 'https://i.pravatar.cc/150?img=3',
        ratingsCount: 10,
        createdAt: new Date(),
      },
      {
        email: 'diana@hyderabad.bits-pilani.ac.in',
        name: 'Diana Wilson',
        image: 'https://i.pravatar.cc/150?img=4',
        ratingsCount: 9,
        createdAt: new Date(),
      },
      {
        email: 'ethan@hyderabad.bits-pilani.ac.in',
        name: 'Ethan Brown',
        image: 'https://i.pravatar.cc/150?img=5',
        ratingsCount: 8,
        createdAt: new Date(),
      },
      {
        email: 'fiona@hyderabad.bits-pilani.ac.in',
        name: 'Fiona Taylor',
        image: 'https://i.pravatar.cc/150?img=6',
        ratingsCount: 7,
        createdAt: new Date(),
      },
      {
        email: 'george@hyderabad.bits-pilani.ac.in',
        name: 'George Martinez',
        image: 'https://i.pravatar.cc/150?img=7',
        ratingsCount: 6,
        createdAt: new Date(),
      },
      {
        email: 'hannah@hyderabad.bits-pilani.ac.in',
        name: 'Hannah Anderson',
        image: 'https://i.pravatar.cc/150?img=8',
        ratingsCount: 5,
        createdAt: new Date(),
      },
    ];

    await db.collection('fotwusers').insertMany(mockUsers);
    console.log('👥 Added 8 mock users to leaderboard');

    // Add ratings for Titanic from multiple users
    const titanicRatings = [
      {
        userId: mockUsers[0].email,
        userEmail: mockUsers[0].email,
        filmId: filmResult.insertedId,
        rating: 5,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        userId: mockUsers[1].email,
        userEmail: mockUsers[1].email,
        filmId: filmResult.insertedId,
        rating: 4.5,
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
      },
      {
        userId: mockUsers[2].email,
        userEmail: mockUsers[2].email,
        filmId: filmResult.insertedId,
        rating: 5,
        createdAt: new Date(Date.now() - 10800000), // 3 hours ago
      },
      {
        userId: mockUsers[3].email,
        userEmail: mockUsers[3].email,
        filmId: filmResult.insertedId,
        rating: 4,
        createdAt: new Date(Date.now() - 14400000), // 4 hours ago
      },
      {
        userId: mockUsers[4].email,
        userEmail: mockUsers[4].email,
        filmId: filmResult.insertedId,
        rating: 4.5,
        createdAt: new Date(Date.now() - 18000000), // 5 hours ago
      },
    ];

    await db.collection('fotwratings').insertMany(titanicRatings);
    console.log('⭐ Added 5 ratings for Titanic');

    // Add mock comments with reactions
    const mockComments = [
      {
        filmId: filmResult.insertedId.toString(),
        userId: mockUsers[0].email,
        userName: mockUsers[0].name,
        userEmail: mockUsers[0].email,
        content:
          'Absolutely breathtaking! The cinematography is stunning and the emotional depth is incredible. James Cameron really outdid himself.',
        reactions: [
          { emoji: '👍', userId: mockUsers[1].email, userName: mockUsers[1].name },
          { emoji: '❤️', userId: mockUsers[2].email, userName: mockUsers[2].name },
          { emoji: '❤️', userId: mockUsers[3].email, userName: mockUsers[3].name },
        ],
        mentions: [],
        createdAt: new Date(Date.now() - 7200000),
        updatedAt: new Date(Date.now() - 7200000),
      },
      {
        filmId: filmResult.insertedId.toString(),
        userId: mockUsers[1].email,
        userName: mockUsers[1].name,
        userEmail: mockUsers[1].email,
        content:
          "The 'I'm flying' scene still gives me chills every time. DiCaprio and Winslet have incredible chemistry!",
        reactions: [
          { emoji: '🔥', userId: mockUsers[0].email, userName: mockUsers[0].name },
          { emoji: '😢', userId: mockUsers[4].email, userName: mockUsers[4].name },
        ],
        mentions: [],
        createdAt: new Date(Date.now() - 5400000),
        updatedAt: new Date(Date.now() - 5400000),
      },
      {
        filmId: filmResult.insertedId.toString(),
        userId: mockUsers[2].email,
        userName: mockUsers[2].name,
        userEmail: mockUsers[2].email,
        content:
          'Fun fact: They actually built a nearly full-scale replica of the ship! The attention to detail is insane.',
        reactions: [
          { emoji: '😮', userId: mockUsers[0].email, userName: mockUsers[0].name },
          { emoji: '👍', userId: mockUsers[1].email, userName: mockUsers[1].name },
        ],
        mentions: [],
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 3600000),
      },
      {
        filmId: filmResult.insertedId.toString(),
        userId: mockUsers[3].email,
        userName: mockUsers[3].name,
        userEmail: mockUsers[3].email,
        content: "Celine Dion's 'My Heart Will Go On' is forever iconic because of this movie 🎵",
        reactions: [
          { emoji: '❤️', userId: mockUsers[0].email, userName: mockUsers[0].name },
          { emoji: '❤️', userId: mockUsers[2].email, userName: mockUsers[2].name },
          { emoji: '🔥', userId: mockUsers[4].email, userName: mockUsers[4].name },
        ],
        mentions: [],
        createdAt: new Date(Date.now() - 1800000),
        updatedAt: new Date(Date.now() - 1800000),
      },
      {
        filmId: filmResult.insertedId.toString(),
        userId: mockUsers[4].email,
        userName: mockUsers[4].name,
        userEmail: mockUsers[4].email,
        content:
          'The ending still makes me cry every single time. There was definitely room on that door! 😭',
        reactions: [
          { emoji: '😂', userId: mockUsers[1].email, userName: mockUsers[1].name },
          { emoji: '😢', userId: mockUsers[2].email, userName: mockUsers[2].name },
          { emoji: '😢', userId: mockUsers[3].email, userName: mockUsers[3].name },
        ],
        mentions: [],
        createdAt: new Date(Date.now() - 900000),
        updatedAt: new Date(Date.now() - 900000),
      },
    ];

    const commentsResult = await db.collection('fotwcomments').insertMany(mockComments);
    console.log('💬 Added 5 comments with reactions');

    // Add a reply to one of the comments
    const reply = {
      filmId: filmResult.insertedId.toString(),
      userId: mockUsers[5].email,
      userName: mockUsers[5].name,
      userEmail: mockUsers[5].email,
      content: '@Ethan Brown I know right?! That debate will never end 😅',
      parentId: commentsResult.insertedIds[4].toString(),
      reactions: [{ emoji: '👍', userId: mockUsers[4].email, userName: mockUsers[4].name }],
      mentions: [mockUsers[4].email],
      createdAt: new Date(Date.now() - 600000),
      updatedAt: new Date(Date.now() - 600000),
    };

    await db.collection('fotwcomments').insertOne(reply);
    console.log('↪️  Added 1 reply');

    console.log('\n✨ FOTW seed data created successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Current Film: Titanic');
    console.log('   - Leaderboard: 8 mock users');
    console.log('   - Ratings: 5 ratings (avg: 4.6/5)');
    console.log('   - Comments: 5 comments + 1 reply with reactions');
    console.log('   - Top Scorers: Alice (12) & Bob (12) - tied!');
    console.log('\n🔗 Visit: http://localhost:3000/club/filmoftheweek');
  } catch (error) {
    console.error('❌ Error seeding FOTW data:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 Database connection closed');
  }
}

seedFOTW();
