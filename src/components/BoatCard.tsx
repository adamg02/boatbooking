import Link from "next/link";

interface BoatCardProps {
  boat: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
  };
}

export default function BoatCard({ boat }: BoatCardProps) {
  return (
    <Link href={`/boats/${boat.id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        {boat.imageUrl ? (
          <img
            src={boat.imageUrl}
            alt={boat.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <svg
              className="w-20 h-20 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
        <div className="p-4">
          <h3 className="text-xl font-semibold mb-2">{boat.name}</h3>
          {boat.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {boat.description}
            </p>
          )}
          <div className="mt-4 text-blue-600 dark:text-blue-400 font-medium">
            View Calendar →
          </div>
        </div>
      </div>
    </Link>
  );
}
