import React, { useContext, useRef, useState } from "react";
import { BeatLoader } from 'react-spinners';
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Tag,
  Input,
  Text,
  Textarea,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import ChakraColorSelector from "@/components/color-selector";
import { DiscussionTopicCategory as Category } from "@/models/discussion";
import { ReadonlyURLSearchParams } from "next/navigation";

interface CreateCategoryModalProps extends ModalProps {
  category: Category,
  setCategory: (c: Category) => void;
  onOKCallback?: () => void;
}

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  category,
  setCategory,
  onOKCallback,
  ...modalProps
}) => {
  const { t } = useTranslation();
  const initialRef = useRef(null);

  //TODO: Form CHeck

  return (
    <>
      <Modal
        size = "lg"
        initialFocusRef={initialRef}
        isCentered
        {...modalProps}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t("CreateCategoryModal.modal.title")}</ModalHeader>
          <ModalCloseButton />

          <ModalBody pb={5}>
            <FormControl pb={5}>
              <FormLabel>{t("CreateCategoryModal.modal.preview")}</FormLabel>
              <Flex alignItems="center" justify="center" overflow="hidden">
                <Tag size="lg" p={2.5} colorScheme={category?.color || "gray"}>
                  {category?.emoji || " "}
                </Tag>
                <Text fontWeight="semibold" wordBreak="break-all" ml={2}>
                  {category?.name}
                </Text>
              </Flex>
            </FormControl>
            <FormControl pb={5} isRequired>
              <FormLabel>{t("CreateCategoryModal.modal.name")}</FormLabel>
              <Input
                placeholder={t("CreateCategoryModal.modal.name")}
                value={category?.name}
                onChange={(e) => {
                  setCategory({...category, name: e.target.value})
                }}
                ref={initialRef}
              />
            </FormControl>
            <FormControl pb={5}>
              <FormLabel>{t("CreateCategoryModal.modal.emoji")}</FormLabel>
              <Input
                placeholder={t("CreateCategoryModal.modal.emoji")}
                value={category?.emoji}
                onChange={(e) => {
                  setCategory({...category, emoji: e.target.value})
                }}
              />
            </FormControl>
            <FormControl pb={5} isRequired>
              <FormLabel>{t("CreateCategoryModal.modal.color")}</FormLabel>
              <ChakraColorSelector 
                current={category?.color || "gray"}
                onColorSelect={(color) => {
                  setCategory({...category, color: color})
                }}
              />
            </FormControl>
            <FormControl>
            <FormLabel>{t("CreateCategoryModal.modal.description")}</FormLabel>
              <Textarea
                placeholder={t("CreateCategoryModal.modal.description")}
                value={category?.description}
                resize="none"
                onChange={(e) => {
                  setCategory({...category, description: e.target.value})
                }}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              spinner={<BeatLoader size={8} color='white' />}
            >
              {t("CreateCategoryModal.modal.save")}
            </Button>
            <Button onClick={modalProps.onClose}>
              {t("CreateCategoryModal.modal.cancel")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreateCategoryModal;