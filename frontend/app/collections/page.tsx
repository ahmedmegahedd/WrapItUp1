import Link from 'next/link'
import Image from 'next/image'
import { getCollections } from '@/lib/data'

export default async function CollectionsPage() {
  const collections = await getCollections()
  
  // Filter active collections and sort by display_order
  const activeCollections = (collections || [])
    .filter((c: any) => c.is_active)
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pink-50/30 pt-24 md:pt-32 pb-24 md:pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <h1 className="text-5xl md:text-7xl font-bold mb-8 md:mb-12 text-gray-900 tracking-tight">
          Collections
        </h1>
        {activeCollections && activeCollections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {activeCollections.map((collection: any) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_20px_60px_rgba(236,72,153,0.15)] transition-all duration-300 transform hover:-translate-y-1 aspect-square relative"
              >
                {collection.image_url && (
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-white overflow-hidden">
                    <Image
                      src={collection.image_url}
                      alt={collection.name}
                      fill
                      className="object-contain transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                {/* Collection name on bottom right with transparent background */}
                <div className="absolute bottom-0 right-0 p-4 md:p-6">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-pink-600 transition-colors bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg">
                    {collection.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">No collections available.</p>
          </div>
        )}
      </div>
    </div>
  )
}
