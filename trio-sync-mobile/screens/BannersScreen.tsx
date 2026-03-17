import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ImageBackground,
    TouchableOpacity,
    Alert,
    Image,
} from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { Colors } from '../constants/Colors';

export default function BannersScreen() {
    const [titulo, setTitulo] = useState('Grande Oportunidade!');
    const [subtitulo, setSubtitulo] = useState('Consórcio de Imóveis');
    const [preco, setPreco] = useState('R$ 500,00');
    const [contato, setContato] = useState('(00) 00000-0000');
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const viewShotRef = useRef<any>(null);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 5],
            quality: 1,
        });

        if (!result.canceled) {
            setBackgroundImage(result.assets[0].uri);
        }
    };

    const shareBanner = async () => {
        try {
            if (viewShotRef.current) {
                const uri = await viewShotRef.current.capture();
                await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartilhar Banner' });
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível gerar o banner.');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>Personalizar Banner</Text>

                <Button
                    title={backgroundImage ? "Trocar Imagem de Fundo" : "Selecionar Imagem de Fundo"}
                    onPress={pickImage}
                    variant="outline"
                    style={{ marginBottom: 16 }}
                />

                <Input
                    label="Título Principal"
                    value={titulo}
                    onChangeText={setTitulo}
                    placeholder="Ex: Promoção Imperdível"
                />
                <Input
                    label="Subtítulo / Descrição"
                    value={subtitulo}
                    onChangeText={setSubtitulo}
                    placeholder="Ex: Taxas reduzidas"
                />
                <Input
                    label="Destaque (Preço/Taxa)"
                    value={preco}
                    onChangeText={setPreco}
                    placeholder="Ex: R$ 250,00"
                />
                <Input
                    label="Contato"
                    value={contato}
                    onChangeText={setContato}
                    placeholder="Ex: (11) 99999-9999"
                    keyboardType="phone-pad"
                />
            </View>

            <Text style={styles.previewLabel}>Pré-visualização:</Text>

            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
                <View style={styles.bannerContainer}>
                    <ImageBackground
                        source={backgroundImage ? { uri: backgroundImage } : require('../assets/logo.jpg')} // Fallback to logo or a default color if needed, but logo might look weird as bg. Better a solid color if no image.
                        style={styles.bannerImage}
                        imageStyle={{ opacity: 0.3 }} // Dim the background slightly
                    >
                        <View style={styles.overlay}>
                            <View style={styles.header}>
                                <Image source={require('../assets/logo.jpg')} style={styles.logo} />
                            </View>

                            <View style={styles.content}>
                                <Text style={styles.bannerTitle}>{titulo}</Text>
                                <Text style={styles.bannerSubtitle}>{subtitulo}</Text>
                                <View style={styles.priceTag}>
                                    <Text style={styles.priceText}>{preco}</Text>
                                </View>
                            </View>

                            <View style={styles.footer}>
                                <Text style={styles.contactLabel}>Fale Conosco:</Text>
                                <Text style={styles.contactText}>{contato}</Text>
                            </View>
                        </View>
                    </ImageBackground>
                </View>
            </ViewShot>

            <View style={styles.actionContainer}>
                <Button
                    title="Compartilhar Banner"
                    onPress={shareBanner}
                    style={styles.shareButton}
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    formContainer: {
        padding: 20,
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 16,
    },
    previewLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginLeft: 20,
        marginBottom: 10,
    },
    bannerContainer: {
        marginHorizontal: 20,
        aspectRatio: 4 / 5, // Instagram portrait ratio
        backgroundColor: Colors.textPrimary,
        borderRadius: 0, // Banners usually square corners for export
        overflow: 'hidden',
        elevation: 5,
    },
    bannerImage: {
        flex: 1,
        justifyContent: 'center',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)', // Dark overlay for text readability
        padding: 20,
        justifyContent: 'space-between',
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
    },
    logo: {
        width: 100,
        height: 40,
        resizeMode: 'contain',
        tintColor: Colors.textInverted, // Make logo white if possible, or keep original
    },
    content: {
        alignItems: 'center',
    },
    bannerTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.textInverted,
        textAlign: 'center',
        textTransform: 'uppercase',
        marginBottom: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    bannerSubtitle: {
        fontSize: 20,
        fontWeight: '500',
        color: Colors.border,
        textAlign: 'center',
        marginBottom: 20,
    },
    priceTag: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 50,
        elevation: 5,
    },
    priceText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.textInverted,
    },
    footer: {
        alignItems: 'center',
        marginBottom: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.3)',
        paddingTop: 15,
    },
    contactLabel: {
        fontSize: 14,
        color: '#d1d5db',
        marginBottom: 4,
    },
    contactText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.textInverted,
    },
    actionContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    shareButton: {
        height: 56,
    },
});
