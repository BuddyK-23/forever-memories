import ProfilePreview from '@/components/ProfilePreview';
import Image from 'next/image';

/**
 * Displays the contents of the landing page within the app.
 */
export default function Home() {
  return (
    <main className="flex flex-col items-center justify-between px-16 pb-4 pt-6">
      <div className="my-10">
        <ProfilePreview />
      </div>
    </main>
  );
}