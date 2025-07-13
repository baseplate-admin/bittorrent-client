import Image, { type ImageProps } from 'next/image';
import styles from './page.module.css';

type Props = Omit<ImageProps, 'src'> & {
    srcLight: string;
    srcDark: string;
};

export default function Home() {
    return <div className="">Hello world</div>;
}
