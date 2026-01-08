"use client"
import Image from "next/image";
import { Calendar, MessageSquare, ArrowRight } from "lucide-react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader
} from "@/components/ui/card";
import { roboto } from "@/lib/fonts";
import { useRouter } from "next/navigation";

const blogPosts = [
    {
        id: 1,
        image: "/blog-1.jpg",
        date: "02 Jan 2022",
        comments: 3,
        title: "Chocolate Truffle Cake With Honey Flavor",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Non mi sed etiam a id at ultricies neque. Tempus, poten diam ac integer id tellus est.",
    },
    {
        id: 2,
        image: "/blog-2.jpg",
        date: "02 Jan 2022",
        comments: 3,
        title: "Chocolate Truffle Cake With Honey Flavor",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Non mi sed etiam a id at ultricies neque. Tempus, poten diam ac integer id tellus est.",
    },
    {
        id: 3,
        image: "/blog-3.jpg",
        date: "02 Jan 2022",
        comments: 3,
        title: "Chocolate Truffle Cake With Honey Flavor",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Non mi sed etiam a id at ultricies neque. Tempus, poten diam ac integer id tellus est.",
    },
];

const BlogSection = () => {
    const router = useRouter();
    return (
        <section className="pt-[110px] pb-[65px] px-4 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-12 relative">
                <div className="relative inline-block">
                    {/* Background Decorative Image */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[200px] h-[190px] z-0">
                        <Image
                            src="/blog-bg.png"
                            alt="Decorative background"
                            fill
                            className="object-contain opacity-80 rotate-[36.87deg]"
                        />
                    </div>
                    <h2 className="text-[42px] font-semibold text-gray-800 relative z-10">
                        Latest news & Blog
                    </h2>
                </div>
                <p className="text-gray-500 mt-[8px] max-w-2xl mx-auto text-sm leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.<br />
                    Varius sed pharetra dictum neque massa congue
                </p>
            </div>

            {/* Blog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogPosts.map((post) => (
                    <Card 
                    key={post.id} 
                    onClick={()=> router.push("/details")}
                    className="border-none shadow-lg rounded-md p-[16px]">
                        <CardHeader className="p-0">
                            <div className="relative -top-[35px] aspect-4/3 overflow-hidden rounded-[20px]">
                                <Image
                                    src={post.image}
                                    alt={post.title}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            </div>
                        </CardHeader>

                        <CardContent className="-mt-10 p-0">
                            {/* Meta Data */}
                            <div className="flex items-center gap-4 text-base text-primary ml-[8px]">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="text-yellow" size={17} />
                                    <span className="text-gray-500 leading-[24px]">{post.date}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MessageSquare className="text-yellow" size={17} />
                                    <span className="text-gray-500 leading-[24px]">Comments ({post.comments.toString().padStart(2, '0')})</span>
                                </div>
                            </div>

                            {/* Title & Description */}
                            <h3 className={`${roboto.className} text-xl font-bold text-[#333333] ml-[8px] mt-[16px] mb-[8px] leading-[28px]`}>
                                {post.title}
                            </h3>
                            <p className="text-gray-600 text-base leading-[24px] line-clamp-3">
                                {post.description}
                            </p>
                        </CardContent>

                        <CardFooter className="pl-[8px] pb-[8px] pt-[16px] -mt-5.5">
                            <button className={`${roboto.className} flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors`}>
                                Read more
                                <ArrowRight size={16} />
                            </button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </section>
    );
};

export default BlogSection;