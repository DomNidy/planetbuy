export default function Hero() {
  return (
    <div className="relative flex h-full w-full flex-col">
      <video
        autoPlay
        muted
        loop
        className="absolute left-0 top-[-200px] z-[1] block h-[850px] w-full rotate-180 object-cover md:top-[-150px] "
      >
        <source src="blackhole.webm" type="video/webm" />
      </video>
      <div className="absolute left-0 top-[310px] z-10 flex  h-[390px] w-full items-center justify-center bg-gradient-to-b from-transparent to-[#020013] px-8 sm:top-[350px] ">
        {" "}
        <h2 className="z-[10] text-center text-6xl font-black tracking-tighter text-pbtext-500">
          Find your new Home
        </h2>
      </div>
    </div>
  );
}
