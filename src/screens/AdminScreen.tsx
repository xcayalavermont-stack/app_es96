import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { MemberRecord } from '../data/huidDatabase';
import {
  loadMembers,
  addMember,
  updateMember,
  deleteMember,
} from '../data/memberStore';
import { useNfcScan } from '../hooks/useNfcScan';

type AdminScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Admin'>;

interface Props {
  navigation: AdminScreenNavigationProp;
}

const CRIMSON = '#A51C30';
const PRESET_LABS = [
  'Soft Robotics',
  'Bioinspired',
  'Microfluidics',
  'Biofabrication',
  'Living Materials',
  'Imaging',
  'Machine Shop',
];

export default function AdminScreen({ navigation }: Props) {
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [editTarget, setEditTarget] = useState<MemberRecord | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const [editName, setEditName] = useState('');
  const [editCardUid, setEditCardUid] = useState('');
  const [editLabs, setEditLabs] = useState<string[]>([]);
  const [editNewLab, setEditNewLab] = useState('');

  const [addHuid, setAddHuid] = useState('');
  const [addName, setAddName] = useState('');
  const [addCardUid, setAddCardUid] = useState('');
  const [addLabs, setAddLabs] = useState<string[]>([]);
  const [addNewLab, setAddNewLab] = useState('');

  const { scan, scanning, supported } = useNfcScan();

  async function scanForEdit() {
    const uid = await scan();
    if (uid) setEditCardUid(uid);
    else if (uid === null && supported) Alert.alert('NFC', 'No card detected. Try again.');
  }

  async function scanForAdd() {
    const uid = await scan();
    if (uid) setAddCardUid(uid);
    else if (uid === null && supported) Alert.alert('NFC', 'No card detected. Try again.');
  }

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const data = await loadMembers();
    setMembers(data);
  }

  function openEdit(member: MemberRecord) {
    setEditTarget(member);
    setEditName(member.name);
    setEditCardUid(member.cardUid);
    setEditLabs(member.labs ? [...member.labs] : []);
    setEditNewLab('');
  }

  function closeEdit() {
    setEditTarget(null);
  }

  async function handleSaveEdit() {
    if (!editTarget) return;
    await updateMember(editTarget.huid, {
      name: editName,
      cardUid: editCardUid,
      labs: editLabs,
    });
    await refresh();
    closeEdit();
  }

  async function handleDelete() {
    if (!editTarget) return;
    Alert.alert(
      'Delete Member',
      `Remove ${editTarget.name} from the database?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMember(editTarget.huid);
            await refresh();
            closeEdit();
          },
        },
      ]
    );
  }

  function openAdd() {
    setAddHuid('');
    setAddName('');
    setAddCardUid('');
    setAddLabs([]);
    setAddNewLab('');
    setShowAdd(true);
  }

  async function handleSaveAdd() {
    if (!addHuid.trim()) {
      Alert.alert('Validation', 'HUID is required.');
      return;
    }
    if (!addName.trim()) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }
    const existing = members.find((m) => m.huid === addHuid.trim());
    if (existing) {
      Alert.alert('Duplicate', 'A member with that HUID already exists.');
      return;
    }
    await addMember({
      huid: addHuid.trim(),
      name: addName.trim(),
      cardUid: addCardUid.trim(),
      labs: addLabs,
    });
    await refresh();
    setShowAdd(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Admin Panel</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Login')}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {members.length === 0 && (
          <Text style={styles.emptyText}>No members yet. Tap + Add Member to get started.</Text>
        )}
        {members.map((member) => (
          <MemberCard key={member.huid} member={member} onEdit={() => openEdit(member)} />
        ))}
      </ScrollView>

      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={openAdd}>
          <Text style={styles.addButtonText}>＋ Add Member</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={editTarget !== null}
        animationType="slide"
        transparent
        onRequestClose={closeEdit}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Edit Member</Text>

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Full name"
              placeholderTextColor="#aaa"
            />

            <Text style={styles.fieldLabel}>NFC Card UID</Text>
            <View style={styles.uidRow}>
              <TextInput
                style={[styles.fieldInput, { flex: 1 }]}
                value={editCardUid}
                onChangeText={setEditCardUid}
                placeholder="XX:XX:XX:XX"
                placeholderTextColor="#aaa"
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.tapCardBtn, (!supported || scanning) && styles.tapCardBtnDisabled]}
                onPress={scanForEdit}
                disabled={!supported || scanning}
              >
                {scanning
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.tapCardBtnText}>Tap Card</Text>}
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Labs</Text>
            <View style={styles.chipRow}>
              {editLabs.map((lab) => (
                <TouchableOpacity
                  key={lab}
                  style={styles.removableChip}
                  onPress={() => setEditLabs(editLabs.filter((l) => l !== lab))}
                >
                  <Text style={styles.removableChipText}>{lab} ✕</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.addLabRow}>
              <TextInput
                style={styles.addLabInput}
                value={editNewLab}
                onChangeText={setEditNewLab}
                placeholder="New lab name"
                placeholderTextColor="#aaa"
              />
              <TouchableOpacity
                style={styles.addLabBtn}
                onPress={() => {
                  const t = editNewLab.trim();
                  if (t && !editLabs.includes(t)) setEditLabs([...editLabs, t]);
                  setEditNewLab('');
                }}
              >
                <Text style={styles.addLabBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.quickAddLabel}>Quick add:</Text>
            <View style={styles.chipRow}>
              {PRESET_LABS.map((lab) => (
                <TouchableOpacity
                  key={lab}
                  style={[styles.presetChip, editLabs.includes(lab) && styles.presetChipActive]}
                  onPress={() => {
                    if (!editLabs.includes(lab)) setEditLabs([...editLabs, lab]);
                  }}
                >
                  <Text style={[styles.presetChipText, editLabs.includes(lab) && styles.presetChipTextActive]}>
                    {lab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeEdit}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Delete Member</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showAdd}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAdd(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Member</Text>

            <Text style={styles.fieldLabel}>HUID</Text>
            <TextInput
              style={styles.fieldInput}
              value={addHuid}
              onChangeText={setAddHuid}
              placeholder="8-digit HUID"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={addName}
              onChangeText={setAddName}
              placeholder="Full name"
              placeholderTextColor="#aaa"
            />

            <Text style={styles.fieldLabel}>NFC Card UID (optional)</Text>
            <View style={styles.uidRow}>
              <TextInput
                style={[styles.fieldInput, { flex: 1 }]}
                value={addCardUid}
                onChangeText={setAddCardUid}
                placeholder="XX:XX:XX:XX"
                placeholderTextColor="#aaa"
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.tapCardBtn, (!supported || scanning) && styles.tapCardBtnDisabled]}
                onPress={scanForAdd}
                disabled={!supported || scanning}
              >
                {scanning
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.tapCardBtnText}>Tap Card</Text>}
              </TouchableOpacity>
            </View>
            <Text style={styles.hintText}>Leave blank to enroll via NFC later</Text>

            <Text style={styles.fieldLabel}>Labs</Text>
            <View style={styles.chipRow}>
              {addLabs.map((lab) => (
                <TouchableOpacity
                  key={lab}
                  style={styles.removableChip}
                  onPress={() => setAddLabs(addLabs.filter((l) => l !== lab))}
                >
                  <Text style={styles.removableChipText}>{lab} ✕</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.addLabRow}>
              <TextInput
                style={styles.addLabInput}
                value={addNewLab}
                onChangeText={setAddNewLab}
                placeholder="New lab name"
                placeholderTextColor="#aaa"
              />
              <TouchableOpacity
                style={styles.addLabBtn}
                onPress={() => {
                  const t = addNewLab.trim();
                  if (t && !addLabs.includes(t)) setAddLabs([...addLabs, t]);
                  setAddNewLab('');
                }}
              >
                <Text style={styles.addLabBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.quickAddLabel}>Quick add:</Text>
            <View style={styles.chipRow}>
              {PRESET_LABS.map((lab) => (
                <TouchableOpacity
                  key={lab}
                  style={[styles.presetChip, addLabs.includes(lab) && styles.presetChipActive]}
                  onPress={() => {
                    if (!addLabs.includes(lab)) setAddLabs([...addLabs, lab]);
                  }}
                >
                  <Text style={[styles.presetChipText, addLabs.includes(lab) && styles.presetChipTextActive]}>
                    {lab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAdd}>
              <Text style={styles.saveBtnText}>Save Member</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

interface MemberCardProps {
  member: MemberRecord;
  onEdit: () => void;
}

function MemberCard({ member, onEdit }: MemberCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{member.name}</Text>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.cardMeta}>HUID: {member.huid}</Text>
      <Text style={styles.cardMeta}>
        Card UID: {member.cardUid ? member.cardUid : 'Not enrolled'}
      </Text>
      <View style={styles.chipRow}>
        {member.labs && member.labs.length > 0 ? (
          member.labs.map((lab) => (
            <View key={lab} style={styles.labChip}>
              <Text style={styles.labChipText}>{lab}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noLabsText}>No labs</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CRIMSON,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CRIMSON,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  topBarTitle: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 28,
    color: '#fff',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  logoutText: {
    fontFamily: 'Oswald_600SemiBold',
    color: '#fff',
    fontSize: 15,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
  addButtonContainer: {
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  addButton: {
    backgroundColor: '#4a5e1a',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  addButtonText: {
    fontFamily: 'Oswald_600SemiBold',
    color: '#fff',
    fontSize: 18,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardName: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 20,
    color: CRIMSON,
    flex: 1,
    marginRight: 8,
  },
  editBtn: {
    borderWidth: 1.5,
    borderColor: CRIMSON,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  editBtnText: {
    fontFamily: 'Oswald_600SemiBold',
    color: CRIMSON,
    fontSize: 14,
  },
  cardMeta: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  labChip: {
    backgroundColor: CRIMSON,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  labChipText: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 12,
    color: '#fff',
  },
  noLabsText: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 13,
    color: '#aaa',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    maxHeight: '92%',
  },
  modalTitle: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 24,
    color: CRIMSON,
    marginBottom: 18,
  },
  fieldLabel: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
    marginTop: 10,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Oswald_400Regular',
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  hintText: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  removableChip: {
    backgroundColor: CRIMSON,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  removableChipText: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 12,
    color: '#fff',
  },
  addLabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  addLabInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: 'Oswald_400Regular',
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  addLabBtn: {
    backgroundColor: CRIMSON,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addLabBtnText: {
    fontFamily: 'Oswald_600SemiBold',
    color: '#fff',
    fontSize: 14,
  },
  quickAddLabel: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 13,
    color: '#888',
    marginTop: 10,
    marginBottom: 4,
  },
  presetChip: {
    borderWidth: 1,
    borderColor: CRIMSON,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  presetChipActive: {
    backgroundColor: CRIMSON,
  },
  presetChipText: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 12,
    color: CRIMSON,
  },
  presetChipTextActive: {
    color: '#fff',
  },
  saveBtn: {
    backgroundColor: CRIMSON,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    fontFamily: 'Oswald_600SemiBold',
    color: '#fff',
    fontSize: 17,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  cancelBtnText: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 16,
    color: '#888',
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  deleteBtnText: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 15,
    color: '#cc2200',
  },
  uidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tapCardBtn: {
    backgroundColor: CRIMSON,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  tapCardBtnDisabled: {
    opacity: 0.45,
  },
  tapCardBtnText: {
    fontFamily: 'Oswald_600SemiBold',
    color: '#fff',
    fontSize: 14,
  },
});
