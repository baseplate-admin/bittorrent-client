export default function NoTorrentSelected({
    ref,
}: {
    ref?: React.Ref<HTMLDivElement>;
}) {
    return (
        <div
            ref={ref}
            className="mb-1 flex justify-center rounded-md border p-62"
        >
            No torrent selected
        </div>
    );
}
