import {
    View,
    Text,
    Image,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { icons } from '@/constants/icons';
import MovieCard from '@/components/MovieCard';

const Save = () => {
    const [watchlist, setWatchlist] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const userId = '1'; // Ganti sesuai login user

    const fetchWatchlist = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `http://localhost:3000/api/watchlist/${userId}`
            );
            if (!response.ok) {
                const text = await response.text();
                console.error('Gagal fetch watchlist:', text);
                setWatchlist([]);
                setLoading(false);
                return;
            }
            const data = await response.json();
            setWatchlist(data);
        } catch (error) {
            console.error('Error fetch watchlist:', error);
        } finally {
            setLoading(false);
        }
    };

    // Refresh setiap kali screen di-fokus
    useFocusEffect(
        useCallback(() => {
            fetchWatchlist();
        }, [])
    );

    return (
        <SafeAreaView className="bg-primary flex-1 px-5">
            {loading ? (
                <ActivityIndicator />
            ) : watchlist.length === 0 ? (
                <View className="flex justify-center items-center flex-1">
                    <Image
                        source={icons.save}
                        className="size-10"
                        tintColor="#fff"
                    />
                    <Text className="text-gray-500 text-base mt-2">
                        No saved movies
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={watchlist}
                    keyExtractor={(item) => item.movie_id.toString()}
                    numColumns={3}
                    columnWrapperStyle={{ justifyContent: 'space-between' }}
                    renderItem={({ item }) => (
                        <MovieCard
                            id={item.movie_id}
                            poster_path={item.poster_path}
                            title={item.title}
                            vote_average={item.vote_average}
                            release_date={item.release_date}
                            movie_id={0}
                            adult={false}
                            backdrop_path={''}
                            genre_ids={[]}
                            original_language={''}
                            original_title={''}
                            overview={''}
                            popularity={0}
                            video={false}
                            vote_count={0}
                        />
                    )}
                    contentContainerStyle={{
                        paddingBottom: 100,
                        paddingTop: 20,
                    }}
                />
            )}
        </SafeAreaView>
    );
};

export default Save;
