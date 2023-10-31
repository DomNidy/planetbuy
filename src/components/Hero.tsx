

export default function Hero() {
  return (
    <div className="absolute  flex h-full w-full flex-col">
      <video
        autoPlay
        muted
        loop
        className="absolute left-0 top-[-340px] z-20 h-full w-full rotate-180 object-fill"
      >
        <source src="blackhole.webm" type="video/webm" />
      </video>
    </div>
  );
}
