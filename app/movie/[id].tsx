import {
    View,
    Text,
    Image,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

import { icons } from '@/constants/icons';
import useFetch from '@/services/usefetch';
import { fetchMovieDetails } from '@/services/api';

interface MovieInfoProps {
    label: string;
    value?: string | number | null;
}

const MovieInfo = ({ label, value }: MovieInfoProps) => (
    <View className="flex-col items-start justify-center mt-5">
        <Text className="text-light-200 font-normal text-sm">{label}</Text>
        <Text className="text-light-100 font-bold text-sm mt-2">
            {value || 'N/A'}
        </Text>
    </View>
);

const Details = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [userId] = useState('1');

    const { data: movie, loading } = useFetch(() =>
        fetchMovieDetails(id as string)
    );

    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (!movie) return;

        const checkSavedStatus = async () => {
            try {
                const response = await fetch(
                    `http://localhost:3000/api/watchlist/check?user_id=${userId}&movie_id=${movie.id}`
                );

                if (!response.ok) {
                    console.error(
                        'Gagal cek status save:',
                        await response.text()
                    );
                    setIsSaved(false);
                    return;
                }

                const result = await response.json();
                setIsSaved(result.saved);
            } catch (error) {
                console.error('Gagal memeriksa status watchlist:', error);
                setIsSaved(false);
            }
        };

        checkSavedStatus();
    }, [movie, userId]);

    const handleSaveMovie = async () => {
        if (!movie) return;
        setIsSaving(true);

        try {
            if (!isSaved) {
                // Save movie
                const response = await fetch(
                    'http://localhost:3000/api/watchlist/save',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            movie_id: movie.id,
                            title: movie.title,
                            poster_path: movie.poster_path,
                            vote_average: movie.vote_average,
                            release_date: movie.release_date,
                        }),
                    }
                );

                if (!response.ok) {
                    const text = await response.text();
                    Alert.alert('Gagal', `Gagal menyimpan movie: ${text}`);
                    setIsSaving(false);
                    return;
                }

                const data = await response.json();
                setIsSaved(true);
                Alert.alert('Berhasil', data.message);
            } else {
                // Remove movie
                const response = await fetch(
                    'http://localhost:3000/api/watchlist/remove',
                    {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            movie_id: movie.id,
                        }),
                    }
                );

                if (!response.ok) {
                    const text = await response.text();
                    Alert.alert('Gagal', `Gagal menghapus movie: ${text}`);
                    setIsSaving(false);
                    return;
                }

                const data = await response.json();
                setIsSaved(false);
                Alert.alert('Dihapus', data.message);
            }
        } catch (error) {
            Alert.alert('Error', 'Terjadi kesalahan saat menyimpan/hapus');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading)
        return (
            <SafeAreaView className="bg-primary flex-1">
                <ActivityIndicator />
            </SafeAreaView>
        );

    return (
        <View className="bg-primary flex-1">
            <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
                <View>
                    <Image
                        source={{
                            uri: `https://image.tmdb.org/t/p/w500${movie?.poster_path}`,
                        }}
                        className="w-full h-[550px]"
                        resizeMode="stretch"
                    />

                    <TouchableOpacity className="absolute bottom-5 right-5 rounded-full size-14 bg-white flex items-center justify-center">
                        <Image
                            source={icons.play}
                            className="w-6 h-7 ml-1"
                            resizeMode="stretch"
                        />
                    </TouchableOpacity>
                </View>

                <View className="flex-col items-start justify-center mt-5 px-5">
                    <View className="flex-row items-center justify-between w-full mb-2">
                        <Text className="text-white font-bold text-xl flex-1 pr-3">
                            {movie?.title}
                        </Text>
                        <TouchableOpacity
                            className={`px-4 py-2 rounded ${
                                isSaved ? 'bg-red-600' : 'bg-green-600'
                            }`}
                            onPress={handleSaveMovie}
                            disabled={isSaving}
                        >
                            <Text className="text-white font-semibold text-sm">
                                {isSaving
                                    ? isSaved
                                        ? 'Removing...'
                                        : 'Saving...'
                                    : isSaved
                                      ? 'Remove'
                                      : 'Save'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center gap-x-1 mt-2">
                        <Text className="text-light-200 text-sm">
                            {movie?.release_date?.split('-')[0]} •
                        </Text>
                        <Text className="text-light-200 text-sm">
                            {movie?.runtime}m
                        </Text>
                    </View>

                    <View className="flex-row items-center bg-dark-100 px-2 py-1 rounded-md gap-x-1 mt-2">
                        <Image source={icons.star} className="size-4" />

                        <Text className="text-white font-bold text-sm">
                            {Math.round(movie?.vote_average ?? 0)}/10
                        </Text>

                        <Text className="text-light-200 text-sm">
                            ({movie?.vote_count} votes)
                        </Text>
                    </View>

                    <MovieInfo label="Overview" value={movie?.overview} />
                    <MovieInfo
                        label="Genres"
                        value={
                            movie?.genres?.map((g) => g.name).join(' • ') ||
                            'N/A'
                        }
                    />

                    <View className="flex flex-row justify-between w-1/2">
                        <MovieInfo
                            label="Budget"
                            value={`$${(movie?.budget ?? 0) / 1_000_000} million`}
                        />
                        <MovieInfo
                            label="Revenue"
                            value={`$${Math.round(
                                (movie?.revenue ?? 0) / 1_000_000
                            )} million`}
                        />
                    </View>

                    <MovieInfo
                        label="Production Companies"
                        value={
                            movie?.production_companies
                                ?.map((c) => c.name)
                                .join(' • ') || 'N/A'
                        }
                    />
                </View>
            </ScrollView>

            <TouchableOpacity
                className="absolute bottom-5 left-0 right-0 mx-5 bg-accent rounded-lg py-3.5 flex flex-row items-center justify-center z-50"
                onPress={router.back}
            >
                <Image
                    source={icons.arrow}
                    className="size-5 mr-1 mt-0.5 rotate-180"
                    tintColor="#fff"
                />
                <Text className="text-white font-semibold text-base">
                    Go Back
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default Details;
