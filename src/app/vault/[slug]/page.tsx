import Link from "next/link";

export default function Page({ params }: { params: { slug: string } }) {
  const vaultAddress = params.slug;
  const data = [
    {
      title: "Daily Selfie",
      headline: "Document Your Journey, Day by Day",
      mintCount: 35,
      url: "https://img.freepik.com/premium-photo/portrait-european-female-college-student-campus_123211-625.jpg",
    },
    {
      title: "Dear Diary",
      headline: "Capture Today, Share Tomorrow",
      mintCount: 54,
      url: "https://img.freepik.com/premium-photo/preparing-classes-university-library-young-student-girl-sitting-with-cup-tea-looking-camera-student-taking-break-from-long-hard-studying-cup-hot-tea-coffee_123211-6516.jpg",
    },
    {
      title: "Legacy Safe",
      headline: "Secure Your Data, Pass Down Your Legacy",
      mintCount: 80,
      url: "https://img.freepik.com/premium-photo/portrait-european-female-college-student-campus_123211-625.jpg",
    },
    {
      title: "Kids Drawings",
      headline: "Preserve Childhood Magic on the Blockchain",
      mintCount: 38,
      url: "https://img.freepik.com/premium-photo/preparing-classes-university-library-young-student-girl-sitting-with-cup-tea-looking-camera-student-taking-break-from-long-hard-studying-cup-hot-tea-coffee_123211-6516.jpg",
    },{
        title: "Dear Diary",
        headline: "Capture Today, Share Tomorrow",
        mintCount: 54,
        url: "https://img.freepik.com/premium-photo/preparing-classes-university-library-young-student-girl-sitting-with-cup-tea-looking-camera-student-taking-break-from-long-hard-studying-cup-hot-tea-coffee_123211-6516.jpg",
      },
      {
        title: "Legacy Safe",
        headline: "Secure Your Data, Pass Down Your Legacy",
        mintCount: 80,
        url: "https://img.freepik.com/premium-photo/preparing-classes-university-library-young-student-girl-sitting-with-cup-tea-looking-camera-student-taking-break-from-long-hard-studying-cup-hot-tea-coffee_123211-6516.jpg",
      },
  ];

  return (
    <div className="px-6 bg-gray-200 pt-10">
      <div className="TopPanel p-2 shadow-lg shadow-gray-500/50 rounded pt-5 bg-white">
        <div className="font-bold text-5xl">Daily Selfie Vault</div>
        <div className="">headline</div>
        <div className="flex gap-2 pt-5">
          <div className="p-1 bg-gray-200 rounded sm">Shared</div>
          <div className="p-1 bg-gray-200 rounded sm">Personal</div>
          <div className="p-1 bg-gray-200 rounded sm">Selfie</div>
        </div>
      </div>
      <div className="List grid grid-cols-4 gap-4 pt-5">
        {data.map((item, idx) => (
          <Link href={`/nft/` + '0xsadkfasdflcscs'} key={idx} className="w-full bg-white rounded cursor-pointer hover:opacity-75">
            <img
              className={`rounded carousel-item h-[220px]`}
              src={item.url}
              alt=""
            />
            <div>asldkfjsaldjkf</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
