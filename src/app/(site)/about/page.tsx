// app/(main)/about/page.tsx

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-9xl font-instrument mb-10">About Us</h1>

      <section className="mb-16">
        <p className="text-xl text-gray-300 leading-relaxed">
          Movie Club, BITS Hyderabad is the filmmaking and review collective of BITS Pilani, Hyderabad Campus. We are a community of active filmmakers and film lovers committed to strengthening film culture on campus. 
        </p>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-regular text-blue-200 mb-4">What We Do</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          <li>Make short films, spanning both traditional and experimental styles of filmmaking.</li>
          <li>Participate in short film competitions and film festivals throughout India, both online and offline.</li>
          <li>Screen films regularly in lecture halls, trying to bring more alternative cinema to the General Body's radar.</li>
          <li>Write reviews, editorials, and recommendations for films on our Instagram page.</li>
          <li>Conduct fun movie-related events for the campus.</li>
        </ul>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-semibold text-pink-200 mb-4">Team</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-2 gap-6">
          {/* You can pull this from a people.json or database later */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-2 bg-gray-700 rounded-full" />
            <p className="text-lg font-medium text-white">Pranay Vajrapu</p>
            <p className="text-sm text-gray-400">Secretary</p>
          </div>
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-2 bg-gray-700 rounded-full" />
            <p className="text-lg font-medium text-white">Sai Ashish Vure</p>
            <p className="text-sm text-gray-400">Joint Secretary</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-regular text-green-200 mb-4">Get Involved</h2>
        <p className="text-gray-300">
          Interested in joining us? Whether you're interested in making short films or are just a huge film buff, we welcome new voices and ideas every semester.
          At the beginning of every semester, we will be floating out our induction form on our socials and on the BPHC SHOUTBOXfacebook group.
        </p>
      </section> 
    </div>)
  }