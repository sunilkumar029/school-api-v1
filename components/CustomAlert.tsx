import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export const CustomAlert = ({
    visible,
    title,
    message,
    onClose,
    onConfirm,
    confirmText = 'OK',
    cancelText = 'Cancel'
}: CustomAlertProps) => {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <View style={styles.actions}>
                        {onConfirm && (
                            <TouchableOpacity style={styles.button} onPress={onClose}>
                                <Text>{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.button} onPress={onConfirm || onClose}>
                            <Text>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: '#00000099',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '80%',
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        marginBottom: 20,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        marginLeft: 16,
    },
});
